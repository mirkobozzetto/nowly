package discord

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"runtime"
	"time"

	"nowly.client/native/internal/logging"
)

const (
	opHandshake uint32 = 0
	opFrame     uint32 = 1
)

type Client struct {
	clientID string
	conn     io.ReadWriteCloser
	ready    bool
	profile  *Profile
	logger   *logging.Logger
}

type Profile struct {
	ID         string
	Username   string
	GlobalName string
	Avatar     string
}

type Packet struct {
	Op   uint32
	Data map[string]any
}

func NewClient(clientID string) *Client {
	return &Client{clientID: clientID}
}

func (c *Client) SetLogger(logger *logging.Logger) {
	c.logger = logger
}

func (c *Client) Connected() bool {
	return c.conn != nil && c.ready
}

func (c *Client) Profile() *Profile {
	return c.profile
}

func (c *Client) Connect() error {
	if c.Connected() {
		return nil
	}

	c.Close()
	c.log("discord connect opening %s", ipcPath())

	conn, err := os.OpenFile(ipcPath(), os.O_RDWR, 0)
	if err != nil {
		c.log("discord connect open failed: %v", err)
		return err
	}
	c.conn = conn

	if _, err := c.conn.Write(encode(opHandshake, map[string]any{
		"v":         1,
		"client_id": c.clientID,
	})); err != nil {
		c.Close()
		c.log("discord handshake write failed: %v", err)
		return err
	}

	packet, err := readPacket(c.conn)
	if err != nil {
		c.Close()
		c.log("discord handshake read failed: %v", err)
		return err
	}
	c.log("discord handshake response: %+v", packet.Data)

	if event, _ := packet.Data["evt"].(string); event != "READY" {
		c.Close()
		return errors.New("discord handshake failed")
	}

	// Snapshot the user identity from the READY payload so the extension can
	// show a real connected preview.
	c.profile = parseReadyProfile(packet.Data)

	c.ready = true
	c.log("discord connected")
	return nil
}

func (c *Client) SetActivity(activity Activity) error {
	if err := c.Connect(); err != nil {
		return err
	}

	err := c.writeCommand(map[string]any{
		"cmd": "SET_ACTIVITY",
		"args": map[string]any{
			"pid":      os.Getpid(),
			"activity": activity,
		},
		"nonce": nonce(),
	})
	if err == nil {
		return nil
	}

	c.Close()
	if reconnectErr := c.Connect(); reconnectErr != nil {
		return reconnectErr
	}
	return c.writeCommand(map[string]any{
		"cmd": "SET_ACTIVITY",
		"args": map[string]any{
			"pid":      os.Getpid(),
			"activity": activity,
		},
		"nonce": nonce(),
	})
}

func (c *Client) ClearActivity() error {
	if err := c.Connect(); err != nil {
		return err
	}

	err := c.writeCommand(map[string]any{
		"cmd": "SET_ACTIVITY",
		"args": map[string]any{
			"pid":      os.Getpid(),
			"activity": nil,
		},
		"nonce": nonce(),
	})
	if err == nil {
		return nil
	}

	c.Close()
	if reconnectErr := c.Connect(); reconnectErr != nil {
		return reconnectErr
	}
	return c.writeCommand(map[string]any{
		"cmd": "SET_ACTIVITY",
		"args": map[string]any{
			"pid":      os.Getpid(),
			"activity": nil,
		},
		"nonce": nonce(),
	})
}

func (c *Client) Close() {
	if c.conn != nil {
		_ = c.conn.Close()
	}
	c.conn = nil
	c.ready = false
	c.profile = nil
}

func parseReadyProfile(payload map[string]any) *Profile {
	data, ok := payload["data"].(map[string]any)
	if !ok {
		return nil
	}
	user, ok := data["user"].(map[string]any)
	if !ok {
		return nil
	}

	id, _ := user["id"].(string)
	username, _ := user["username"].(string)
	if id == "" || username == "" {
		return nil
	}

	globalName, _ := user["global_name"].(string)
	avatar, _ := user["avatar"].(string)

	return &Profile{ID: id, Username: username, GlobalName: globalName, Avatar: avatar}
}

func (c *Client) writeCommand(payload map[string]any) error {
	if c.conn == nil {
		return errors.New("discord ipc is not connected")
	}
	c.log("discord command -> %+v", payload)
	if _, err := c.conn.Write(encode(opFrame, payload)); err != nil {
		c.log("discord command write failed: %v", err)
		return err
	}

	packet, err := readPacket(c.conn)
	if err != nil {
		c.log("discord command read failed: %v", err)
		return err
	}
	c.log("discord command <- op=%d data=%+v", packet.Op, packet.Data)

	if event, _ := packet.Data["evt"].(string); event == "ERROR" {
		if data, ok := packet.Data["data"].(map[string]any); ok {
			code := data["code"]
			message := data["message"]
			return fmt.Errorf("discord rpc error %v: %v", code, message)
		}
		return errors.New("discord rpc error")
	}

	return nil
}

func (c *Client) log(format string, args ...any) {
	if c.logger == nil {
		return
	}
	c.logger.Printf(format, args...)
}

func ipcPath() string {
	if runtime.GOOS == "windows" {
		return `\\.\pipe\discord-ipc-0`
	}

	base := os.Getenv("XDG_RUNTIME_DIR")
	if base == "" {
		base = os.Getenv("TMPDIR")
	}
	if base == "" {
		base = "/tmp"
	}
	return base + "/discord-ipc-0"
}

func encode(op uint32, payload any) []byte {
	body, _ := json.Marshal(payload)
	buffer := new(bytes.Buffer)
	_ = binary.Write(buffer, binary.LittleEndian, op)
	_ = binary.Write(buffer, binary.LittleEndian, uint32(len(body)))
	_, _ = buffer.Write(body)
	return buffer.Bytes()
}

func readPacket(reader io.Reader) (*Packet, error) {
	var header [8]byte
	if _, err := io.ReadFull(reader, header[:]); err != nil {
		return nil, err
	}

	length := binary.LittleEndian.Uint32(header[4:8])
	body := make([]byte, length)
	if _, err := io.ReadFull(reader, body); err != nil {
		return nil, err
	}

	var data map[string]any
	if err := json.Unmarshal(body, &data); err != nil {
		return nil, fmt.Errorf("decode discord packet: %w", err)
	}

	return &Packet{
		Op:   binary.LittleEndian.Uint32(header[0:4]),
		Data: data,
	}, nil
}

func nonce() string {
	return time.Now().Format("20060102150405.000000000")
}
