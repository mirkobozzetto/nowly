package main

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"os"
	"runtime"
	"time"
)

type NativeMessage struct {
	Type     string    `json:"type"`
	Presence *Presence `json:"presence,omitempty"`
}

type Presence struct {
	Details    string `json:"details,omitempty"`
	State      string `json:"state,omitempty"`
	StartTime  int64  `json:"startTime,omitempty"`
	LargeImage string `json:"largeImage,omitempty"`
	LargeText  string `json:"largeText,omitempty"`
}

type DiscordPacket struct {
	Op   uint32
	Data map[string]interface{}
}

const clientID = "1510223984392671302"

var discord io.ReadWriteCloser
var discordReady bool

func sendNative(v interface{}) {
	b, _ := json.Marshal(v)
	var header [4]byte
	binary.LittleEndian.PutUint32(header[:], uint32(len(b)))
	os.Stdout.Write(header[:])
	os.Stdout.Write(b)
}

func readNative(r *bufio.Reader) (*NativeMessage, error) {
	header := make([]byte, 4)
	if _, err := io.ReadFull(r, header); err != nil { return nil, err }
	length := binary.LittleEndian.Uint32(header)
	if length == 0 || length > 1024*1024 { return nil, errors.New("invalid native message length") }
	payload := make([]byte, length)
	if _, err := io.ReadFull(r, payload); err != nil { return nil, err }
	var msg NativeMessage
	if err := json.Unmarshal(payload, &msg); err != nil { return nil, err }
	return &msg, nil
}

func ipcPath() string {
	if runtime.GOOS == "windows" { return `\\.\pipe\discord-ipc-0` }
	base := os.Getenv("XDG_RUNTIME_DIR")
	if base == "" { base = os.Getenv("TMPDIR") }
	if base == "" { base = "/tmp" }
	return base + "/discord-ipc-0"
}

func encodeDiscord(op uint32, payload interface{}) []byte {
	body, _ := json.Marshal(payload)
	buf := new(bytes.Buffer)
	binary.Write(buf, binary.LittleEndian, op)
	binary.Write(buf, binary.LittleEndian, uint32(len(body)))
	buf.Write(body)
	return buf.Bytes()
}

func readDiscordPacket(r io.Reader) (*DiscordPacket, error) {
	header := make([]byte, 8)
	if _, err := io.ReadFull(r, header); err != nil { return nil, err }
	op := binary.LittleEndian.Uint32(header[0:4])
	length := binary.LittleEndian.Uint32(header[4:8])
	body := make([]byte, length)
	if _, err := io.ReadFull(r, body); err != nil { return nil, err }
	var data map[string]interface{}
	if err := json.Unmarshal(body, &data); err != nil { return nil, err }
	return &DiscordPacket{Op: op, Data: data}, nil
}

func connectDiscord() error {
	if discord != nil && discordReady { return nil }
	f, err := os.OpenFile(ipcPath(), os.O_RDWR, 0)
	if err != nil { return err }
	discord = f
	_, _ = discord.Write(encodeDiscord(0, map[string]interface{}{"v": 1, "client_id": clientID}))
	pkt, err := readDiscordPacket(discord)
	if err != nil { _ = discord.Close(); discord = nil; return err }
	if evt, _ := pkt.Data["evt"].(string); evt == "READY" {
		discordReady = true
		sendNative(map[string]interface{}{"type":"CONNECTED"})
		return nil
	}
	_ = discord.Close(); discord = nil
	return errors.New("discord handshake failed")
}

func setActivity(p Presence) error {
	if err := connectDiscord(); err != nil { return err }
	activity := map[string]interface{}{"type": 0}
	if p.Details != "" { activity["details"] = p.Details }
	if p.State != "" { activity["state"] = p.State }
	if p.StartTime > 0 { activity["timestamps"] = map[string]interface{}{"start": p.StartTime} }
	if p.LargeImage != "" { activity["assets"] = map[string]interface{}{"large_image": p.LargeImage, "large_text": p.LargeText} }
	payload := map[string]interface{}{
		"cmd": "SET_ACTIVITY",
		"args": map[string]interface{}{"pid": os.Getpid(), "activity": activity},
		"nonce": time.Now().Format("20060102150405.000000000"),
	}
	_, err := discord.Write(encodeDiscord(1, payload))
	return err
}

func clearActivity() error {
	if err := connectDiscord(); err != nil { return err }
	payload := map[string]interface{}{
		"cmd": "SET_ACTIVITY",
		"args": map[string]interface{}{"pid": os.Getpid(), "activity": nil},
		"nonce": time.Now().Format("20060102150405.000000000"),
	}
	_, err := discord.Write(encodeDiscord(1, payload))
	return err
}

func main() {
	if err := connectDiscord(); err != nil { sendNative(map[string]interface{}{"type":"ERROR", "error":"Discord non disponible: " + err.Error()}) }
	r := bufio.NewReader(os.Stdin)
	for {
		msg, err := readNative(r)
		if err != nil { return }
		switch msg.Type {
		case "PING":
			status := "ok"
			if err := connectDiscord(); err != nil { status = err.Error() }
			sendNative(map[string]interface{}{"type":"PONG", "connected": discordReady, "status": status})
		case "SET_ACTIVITY":
			if msg.Presence == nil { sendNative(map[string]interface{}{"type":"ERROR", "error":"presence missing"}); continue }
			if err := setActivity(*msg.Presence); err != nil { sendNative(map[string]interface{}{"type":"ERROR", "error":err.Error()}) } else { sendNative(map[string]interface{}{"type":"OK"}) }
		case "CLEAR_ACTIVITY":
			if err := clearActivity(); err != nil { sendNative(map[string]interface{}{"type":"ERROR", "error":err.Error()}) } else { sendNative(map[string]interface{}{"type":"OK"}) }
		}
	}
}
