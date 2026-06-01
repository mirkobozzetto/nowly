package native

import (
	"bytes"
	"encoding/binary"
	"testing"
)

func TestProtocolWriteAndRead(t *testing.T) {
	buffer := new(bytes.Buffer)
	protocol := NewProtocol(buffer, buffer)

	input := map[string]string{"type": "PING"}
	if err := protocol.Write(input); err != nil {
		t.Fatalf("write failed: %v", err)
	}

	var output map[string]string
	if err := protocol.Read(&output); err != nil {
		t.Fatalf("read failed: %v", err)
	}

	if output["type"] != "PING" {
		t.Fatalf("expected PING, got %q", output["type"])
	}
}

func TestProtocolRejectsInvalidLength(t *testing.T) {
	buffer := new(bytes.Buffer)
	var header [4]byte
	binary.LittleEndian.PutUint32(header[:], MaxMessageSize+1)
	buffer.Write(header[:])

	protocol := NewProtocol(buffer, bytes.NewBuffer(nil))
	var output map[string]string
	if err := protocol.Read(&output); err != ErrInvalidMessageLength {
		t.Fatalf("expected ErrInvalidMessageLength, got %v", err)
	}
}