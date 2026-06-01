package logging

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"nowly.client/native/internal/contract"
)

type Logger struct {
	mu   sync.Mutex
	file *os.File
}

func New() (*Logger, error) {
	dir := filepath.Join(os.Getenv("LOCALAPPDATA"), contract.InstallFolderName)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	file, err := os.OpenFile(filepath.Join(dir, "nowly-host.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, err
	}

	return &Logger{file: file}, nil
}

func (l *Logger) Close() {
	if l == nil || l.file == nil {
		return
	}
	_ = l.file.Close()
}

func (l *Logger) Printf(format string, args ...any) {
	if l == nil || l.file == nil {
		return
	}

	l.mu.Lock()
	defer l.mu.Unlock()

	line := fmt.Sprintf(format, args...)
	_, _ = fmt.Fprintf(l.file, "%s %s\n", time.Now().Format(time.RFC3339Nano), line)
}
