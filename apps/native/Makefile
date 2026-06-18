ifneq ($(OS),Windows_NT)
  RUNNER        :=
  RELEASE_SCRIPT := scripts/release.sh
  PUBLISH_SCRIPT := scripts/publish-prod.sh
else
  RUNNER        := powershell -NoProfile -File
  RELEASE_SCRIPT := scripts/release.ps1
  PUBLISH_SCRIPT := scripts/publish-prod.ps1
endif

-include .env

BINARY_NAME    := nowly-host
DIST_DIR       := dist
SCRIPTS_DIR    := scripts
HOST_VERSION   ?= 0.0.0-dev
LDFLAGS        := -X nowly.client/native/internal/contract.HostVersion=$(HOST_VERSION)

.PHONY: build build/windows build/linux build/darwin build/darwin-arm installer clean build/macos release/macos

build: build/windows build/linux build/darwin build/darwin-arm

build/windows:
	GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME).exe ./cmd/host

build/linux:
	GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME)-linux ./cmd/host

build/darwin:
	GOOS=darwin GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME)-darwin ./cmd/host

build/darwin-arm:
	GOOS=darwin GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(DIST_DIR)/$(BINARY_NAME)-darwin-arm64 ./cmd/host

build/macos: build/darwin build/darwin-arm

release/macos:
	$(SCRIPTS_DIR)/macos-release.sh $(HOST_VERSION)

ifneq ($(OS),Windows_NT)
installer:
	@echo "Installer build is Windows only"
else
installer:
	$(RUNNER) scripts/installer.ps1 $(HOST_VERSION)
endif

install/linux: build/linux
	$(SCRIPTS_DIR)/install-linux.sh $(DIST_DIR)/$(BINARY_NAME)-linux

install/darwin: build/darwin
	$(SCRIPTS_DIR)/install-macos.sh $(DIST_DIR)/$(BINARY_NAME)-darwin

install/darwin-arm: build/darwin-arm
	$(SCRIPTS_DIR)/install-macos.sh $(DIST_DIR)/$(BINARY_NAME)-darwin-arm64

release:
	$(RUNNER) $(RELEASE_SCRIPT) $(HOST_VERSION)

publish-prod: release
	$(RUNNER) $(PUBLISH_SCRIPT) $(HOST_VERSION)

release-prod: publish-prod

uninstall/linux:
	$(SCRIPTS_DIR)/uninstall-linux.sh

uninstall/darwin:
	$(SCRIPTS_DIR)/uninstall-macos.sh

clean:
	rm -rf $(DIST_DIR)
