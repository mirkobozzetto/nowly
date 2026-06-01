package main

import (
	"errors"
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
	logger.Printf("nowly host starting pid=%d", os.Getpid())

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
			status := "connected"
			if client.Connected() {
				status = "discord connected"
			}
			logger.Printf("native -> PONG connected=true status=%q", status)
			_ = protocol.Write(contract.Pong(true, status))

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
