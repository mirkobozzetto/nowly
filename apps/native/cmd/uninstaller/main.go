package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

const hostName = "fr.DP_PROJECT_NAME.client"

func regDelete(path string) { _ = exec.Command("reg", "delete", path, "/f").Run() }

func main() {
	regDelete(`HKCU\Software\Google\Chrome\NativeMessagingHosts\` + hostName)
	regDelete(`HKCU\Software\Microsoft\Edge\NativeMessagingHosts\` + hostName)
	regDelete(`HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\` + hostName)
	dir := filepath.Join(os.Getenv("LOCALAPPDATA"), "DP_PROJECT_NAME")
	_ = os.RemoveAll(dir)
	fmt.Println("DP_PROJECT_NAME has been uninstalled.")
	fmt.Println("You can now safely close this window.")