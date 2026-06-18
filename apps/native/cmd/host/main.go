package main

import (
	"errors"
	"fmt"
	"io"
	"os"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/discord"
	"nowly.client/native/internal/logging"
	nativeprotocol "nowly.client/native/internal/native"
)

func main() {
	logger, _ := logging.New()
	defer logger.Close()
	logger.Printf("nowly host starting pid=%d version=%s", os.Getpid(), contract.HostVersion)

	protocol := nativeprotocol.NewProtocol(os.Stdin, os.Stdout)
	client := discord.NewClient(contract.DiscordClientID)
	client.SetLogger(logger)
	defer client.Close()

	_ = protocol.Write(contract.Connected())

	lastActivityLogKey := ""
	lastLoggedClear := false

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

			_ = protocol.Write(contract.PongWithProfile(true, discordConnected, status, profile))

		case contract.MessageSetActivity:
			if message.Presence == nil {
				logger.Printf("native -> ERROR presence missing")
				_ = protocol.Write(contract.Error("presence missing"))
				continue
			}
			logKey := activityLogKey(*message.Presence)
			if logKey != lastActivityLogKey {
				logger.Printf("native <- SET_ACTIVITY %s", logKey)
				lastActivityLogKey = logKey
			}
			lastLoggedClear = false

			activity := discord.ActivityFromPresence(*message.Presence)
			if err := client.SetActivity(activity); err != nil {
				logger.Printf("native -> ERROR %v", err)
				_ = protocol.Write(contract.Error(err.Error()))
				continue
			}
			_ = protocol.Write(contract.OK())

		case contract.MessageClearActivity:
			if !lastLoggedClear {
				logger.Printf("native <- CLEAR_ACTIVITY")
			}
			lastActivityLogKey = ""
			lastLoggedClear = true

			if err := client.ClearActivity(); err != nil {
				logger.Printf("native -> ERROR %v", err)
				_ = protocol.Write(contract.Error(err.Error()))
				continue
			}
			_ = protocol.Write(contract.OK())

		default:
			logger.Printf("native -> ERROR unknown message type %q", message.Type)
			_ = protocol.Write(contract.Error("unknown message type"))
		}
	}
}

func activityLogKey(p contract.PresencePayload) string {
	return fmt.Sprintf(
		"name=%q type=%d details=%q state=%q largeImage=%q buttons=%d",
		p.Name,
		p.Type,
		p.Details,
		p.State,
		p.LargeImage,
		len(p.Buttons),
	)
}
