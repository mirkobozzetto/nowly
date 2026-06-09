BINARY_NAME    := nowly-host
EXTENSION_ID   ?= abbegmindbabanjcabnmcjmamaoffbam
DIST_DIR       := dist
SCRIPTS_DIR    := scripts
HOST_VERSION   ?= 0.0.0-dev
LDFLAGS        := -X nowly.client/native/internal/contract.HostVersion=$(HOST_VERSION)

.PHONY: build build/windows build/linux build/darwin build/darwin-arm clean

build: build/windows build/linux build/darwin build/darwin-arm

build/windows:
	GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME).exe ./cmd/host

build/linux:
	GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME)-linux ./cmd/host

build/darwin:
	GOOS=darwin GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME)-darwin ./cmd/host

build/darwin-arm:
	GOOS=darwin GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME)-darwin-arm64 ./cmd/host

install/linux: build/linux
	EXTENSION_ID=$(EXTENSION_ID) $(SCRIPTS_DIR)/install-linux.sh $(DIST_DIR)/$(BINARY_NAME)-linux

install/darwin: build/darwin
	EXTENSION_ID=$(EXTENSION_ID) $(SCRIPTS_DIR)/install-macos.sh $(DIST_DIR)/$(BINARY_NAME)-darwin

install/darwin-arm: build/darwin-arm
	EXTENSION_ID=$(EXTENSION_ID) $(SCRIPTS_DIR)/install-macos.sh $(DIST_DIR)/$(BINARY_NAME)-darwin-arm64

uninstall/linux:
	$(SCRIPTS_DIR)/uninstall-linux.sh

uninstall/darwin:
	$(SCRIPTS_DIR)/uninstall-macos.sh

clean:
	rm -rf $(DIST_DIR)
