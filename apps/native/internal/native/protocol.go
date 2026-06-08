package native

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"sync"
)

const MaxMessageSize = 1024 * 1024

var ErrInvalidMessageLength = errors.New("invalid native message length")

type Protocol struct {
	mu sync.Mutex
	in  io.Reader
	out io.Writer
}

func NewProtocol(in io.Reader, out io.Writer) *Protocol {
	return &Protocol{in: in, out: out}
}

func (p *Protocol) Read(v any) error {
	var header [4]byte
	if _, err := io.ReadFull(p.in, header[:]); err != nil {
		return err
	}

	length := binary.LittleEndian.Uint32(header[:])
	if length == 0 || length > MaxMessageSize {
		return ErrInvalidMessageLength
	}

	payload := make([]byte, length)
	if _, err := io.ReadFull(p.in, payload); err != nil {
		return err
	}

	if err := json.Unmarshal(payload, v); err != nil {
		return fmt.Errorf("decode native message: %w", err)
	}
	return nil
}

func (p *Protocol) Write(v any) error {
	payload, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("encode native response: %w", err)
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	var header [4]byte
	binary.LittleEndian.PutUint32(header[:], uint32(len(payload)))
	if _, err := p.out.Write(header[:]); err != nil {
		return err
	}
	_, err = p.out.Write(payload)
	return err
}