package main

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/discord"
	"nowly.client/native/internal/logging"
	nativeprotocol "nowly.client/native/internal/native"
)

func installManifests(logger *logging.Logger) {
	if runtime.GOOS != "darwin" {
		return
	}

	exe, err := os.Executable()
	if err != nil {
		logger.Printf("install: failed to get executable path: %v", err)
		return
	}

	if !strings.Contains(exe, ".app/Contents/MacOS/") {
		return
	}

	logger.Printf("install: detected .app bundle at %s", exe)

	home, err := os.UserHomeDir()
	if err != nil {
		logger.Printf("install: failed to get home dir: %v", err)
		return
	}

	hostName := contract.HostName

	chromeManifest := fmt.Sprintf(`{
  "name": "%s",
  "description": "Nowly Native Messaging Host",
  "path": "%s",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://kmnlnfldimgneaopdihplkebobckcjpf/",
    "chrome-extension://abbegmindbabanjcabnmcjmamaoffbam/"
  ]
}
`, hostName, exe)

	firefoxManifest := fmt.Sprintf(`{
  "name": "%s",
  "description": "Nowly Native Messaging Host",
  "path": "%s",
  "type": "stdio",
  "allowed_extensions": [
    "abbegmindbabanjcabnmcjmamaoffbam"
  ]
}
`, hostName, exe)

	browserDirs := []string{
		"Google/Chrome",
		"Chromium",
		"BraveSoftware/Brave-Browser",
		"Microsoft Edge",
	}

	installed := 0
	for _, browser := range browserDirs {
		dir := filepath.Join(home, "Library/Application Support", browser, "NativeMessagingHosts")
		if err := os.MkdirAll(dir, 0755); err != nil {
			logger.Printf("install: mkdir %s: %v", dir, err)
			continue
		}
		path := filepath.Join(dir, hostName+".json")
		if err := os.WriteFile(path, []byte(chromeManifest), 0644); err != nil {
			logger.Printf("install: write %s: %v", path, err)
			continue
		}
		logger.Printf("install: wrote %s", path)
		installed++
	}

	firefoxDir := filepath.Join(home, "Library/Application Support/Mozilla/NativeMessagingHosts")
	if err := os.MkdirAll(firefoxDir, 0755); err != nil {
		logger.Printf("install: mkdir %s: %v", firefoxDir, err)
	} else {
		path := filepath.Join(firefoxDir, hostName+".json")
		if err := os.WriteFile(path, []byte(firefoxManifest), 0644); err != nil {
			logger.Printf("install: write %s: %v", path, err)
		} else {
			logger.Printf("install: wrote %s", path)
		}
	}

	logger.Printf("install: registered for %d Chromium-based browsers + Firefox", installed)
}

func main() {
	logger, _ := logging.New()
	defer logger.Close()
	logger.Printf("nowly host starting pid=%d version=%s", os.Getpid(), contract.HostVersion)

	installManifests(logger)

	protocol := nativeprotocol.NewProtocol(os.Stdin, os.Stdout)
	client := discord.NewClient(contract.DiscordClientID)
	client.SetLogger(logger)
	defer client.Close()

	_ = protocol.Write(contract.Connected())

	for {
		var message contract.NativeMessage
		if err := protocol.Read(&message); err != nil {
			if errors.Is(err, io.EOF) || errors.Is(err, io.ErrUnexpectedEOF) {
				return
			}
			_ = protocol.Write(contract.Error(err.Error()))
			continue
		}

		switch message.Type {
		case contract.MessagePing:
			logger.Printf("native <- PING")
			// Best-effort attempt to connect to Discord so the extension can detect
			// a successful setup without requiring an activity update first.
			_ = client.Connect()
			status := "connected"
			discordConnected := client.Connected()
			if discordConnected {
				status = "discord connected"
			}

			var profile *contract.DiscordProfile
			if p := client.Profile(); discordConnected && p != nil {
				profile = &contract.DiscordProfile{ID: p.ID, Username: p.Username, GlobalName: p.GlobalName, Avatar: p.Avatar}
			}

			logger.Printf("native -> PONG connected=true discordConnected=%v status=%q", discordConnected, status)
			_ = protocol.Write(contract.PongWithProfile(true, discordConnected, status, profile))

		case contract.MessageSetActivity:
			logger.Printf("native <- SET_ACTIVITY presence=%+v", message.Presence)
			if message.Presence == nil {
				logger.Printf("native -> ERROR presence missing")
				_ = protocol.Write(contract.Error("presence missing"))
				continue
			}
			activity := discord.ActivityFromPresence(*message.Presence)
			if err := client.SetActivity(activity); err != nil {
				logger.Printf("native -> ERROR %v", err)
				_ = protocol.Write(contract.Error(err.Error()))
				continue
			}
			logger.Printf("native -> OK set activity")
			_ = protocol.Write(contract.OK())

		case contract.MessageClearActivity:
			logger.Printf("native <- CLEAR_ACTIVITY")
			if err := client.ClearActivity(); err != nil {
				logger.Printf("native -> ERROR %v", err)
				_ = protocol.Write(contract.Error(err.Error()))
				continue
			}
			logger.Printf("native -> OK clear activity")
			_ = protocol.Write(contract.OK())

		default:
			logger.Printf("native -> ERROR unknown message type %q", message.Type)
			_ = protocol.Write(contract.Error("unknown message type"))
		}
	}
}


