package main

import (
	"errors"
	"io"
	"os"

	"nowly.client/native/internal/contract"
	"nowly.client/native/internal/discord"
	nativeprotocol "nowly.client/native/internal/native"
)

func main() {
	protocol := nativeprotocol.NewProtocol(os.Stdin, os.Stdout)
	client := discord.NewClient(contract.DiscordClientID)
	defer client.Close()

	if err := client.Connect(); err == nil {
		_ = protocol.Write(contract.Connected())
	}

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
			status := "ok"
			if err := client.Connect(); err != nil {
				status = err.Error()
			}
			_ = protocol.Write(contract.Pong(client.Connected(), status))

		case contract.MessageSetActivity:
			if message.Presence == nil {
				_ = protocol.Write(contract.Error("presence missing"))
				continue
			}
			activity := discord.ActivityFromPresence(*message.Presence)
			if err := client.SetActivity(activity); err != nil {
				_ = protocol.Write(contract.Error(err.Error()))
				continue
			}
			_ = protocol.Write(contract.OK())

		case contract.MessageClearActivity:
			if err := client.ClearActivity(); err != nil {
				_ = protocol.Write(contract.Error(err.Error()))
				continue
			}
			_ = protocol.Write(contract.OK())

		default:
			_ = protocol.Write(contract.Error("unknown message type"))
		}
	}
}
