package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"nowly.client/native/internal/contract"
)

type NativeManifest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Path           string   `json:"path"`
	Type           string   `json:"type"`
	AllowedOrigins []string `json:"allowed_origins"`
}

func main() {
	if err := install(); err != nil {
		fmt.Println("Installation failed:", err)
		os.Exit(1)
	}

	fmt.Println("Nowly native host installed.")
	fmt.Println("Host:", contract.HostName)
	fmt.Println("Folder:", installDir())
}

func install() error {
	executable, err := os.Executable()
	if err != nil {
		return err
	}

	sourceHostPath := filepath.Join(filepath.Dir(executable), contract.HostExecutableName)
	if _, err := os.Stat(sourceHostPath); err != nil {
		return fmt.Errorf("host executable not found next to installer: %w", err)
	}
	sourceUninstallerPath := filepath.Join(filepath.Dir(executable), contract.UninstallerName)
	if _, err := os.Stat(sourceUninstallerPath); err != nil {
		return fmt.Errorf("uninstaller executable not found next to installer: %w", err)
	}

	dir := installDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	hostPath := filepath.Join(dir, contract.HostExecutableName)
	if err := copyFile(sourceHostPath, hostPath); err != nil {
		return err
	}
	uninstallerPath := filepath.Join(dir, contract.UninstallerName)
	if err := copyFile(sourceUninstallerPath, uninstallerPath); err != nil {
		return err
	}

	manifestPath := filepath.Join(dir, contract.HostName+".json")
	manifest := NativeManifest{
		Name:        contract.HostName,
		Description: "Nowly Native Messaging Host",
		Path:        hostPath,
		Type:        "stdio",
		AllowedOrigins: []string{
			"chrome-extension://" + contract.ExtensionID + "/",
		},
	}

	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(manifestPath, data, 0644); err != nil {
		return err
	}

	for browser, regPath := range browserRegistryPaths() {
		if err := regAdd(regPath, manifestPath); err != nil {
			fmt.Println("Warning:", browser, "not configured:", err)
		} else {
			fmt.Println("OK:", browser, "configured")
		}
	}

	return nil
}

func installDir() string {
	return filepath.Join(os.Getenv("LOCALAPPDATA"), contract.InstallFolderName)
}

func browserRegistryPaths() map[string]string {
	return map[string]string{
		"Chrome": `HKCU\Software\Google\Chrome\NativeMessagingHosts\` + contract.HostName,
		"Edge":   `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\` + contract.HostName,
		"Brave":  `HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\` + contract.HostName,
	}
}

func regAdd(path string, manifestPath string) error {
	return exec.Command("reg", "add", path, "/ve", "/t", "REG_SZ", "/d", manifestPath, "/f").Run()
}

func copyFile(source string, target string) error {
	data, err := os.ReadFile(source)
	if err != nil {
		return err
	}
	return os.WriteFile(target, data, 0755)
}
