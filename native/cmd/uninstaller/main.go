package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"nowly.client/native/internal/contract"
)

func main() {
	for _, regPath := range browserRegistryPaths() {
		_ = exec.Command("reg", "delete", regPath, "/f").Run()
	}

	dir := filepath.Join(os.Getenv("LOCALAPPDATA"), contract.InstallFolderName)
	_ = os.RemoveAll(dir)

	fmt.Println("Nowly native host uninstalled.")
}

func browserRegistryPaths() []string {
	return []string{
		`HKCU\Software\Google\Chrome\NativeMessagingHosts\` + contract.HostName,
		`HKCU\Software\Microsoft\Edge\NativeMessagingHosts\` + contract.HostName,
		`HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\` + contract.HostName,
	}
}
