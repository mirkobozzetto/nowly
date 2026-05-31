package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

//go:embed assets/dp-project-name-host.exe
var hostExe []byte

//go:embed assets/dp-project-name-uninstaller.exe
var uninstallExe []byte

const hostName = "fr.DP_PROJECT_NAME.client"
const extensionID = "gpdelmidejpnimhpdhjlgcbljkbppkdi"

type NativeManifest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Path           string   `json:"path"`
	Type           string   `json:"type"`
	AllowedOrigins []string `json:"allowed_origins"`
}

func regAdd(path string, manifestPath string) error {
	return exec.Command("reg", "add", path, "/ve", "/t", "REG_SZ", "/d", manifestPath, "/f").Run()
}

func main() {
	local := os.Getenv("LOCALAPPDATA")
	if local == "" {
		fmt.Println("Erreur: LOCALAPPDATA introuvable.")
		os.Exit(1)
	}

	installDir := filepath.Join(local, "DP_PROJECT_NAME")
	if err := os.MkdirAll(installDir, 0755); err != nil {
		fmt.Println("Erreur creation dossier:", err)
		os.Exit(1)
	}

	hostPath := filepath.Join(installDir, "dp-project-name-host.exe")
	uninstallPath := filepath.Join(installDir, "dp-project-name-uninstaller.exe")
	manifestPath := filepath.Join(installDir, hostName+".json")

	if err := os.WriteFile(hostPath, hostExe, 0755); err != nil { fmt.Println("Erreur ecriture host:", err); os.Exit(1) }
	if err := os.WriteFile(uninstallPath, uninstallExe, 0755); err != nil { fmt.Println("Erreur ecriture uninstaller:", err); os.Exit(1) }

	manifest := NativeManifest{
		Name: hostName,
		Description: "DP_PROJECT_NAME Native Host",
		Path: hostPath,
		Type: "stdio",
		AllowedOrigins: []string{"chrome-extension://" + extensionID + "/"},
	}
	data, _ := json.MarshalIndent(manifest, "", "  ")
	// Important: the JSON value must contain normal Windows backslashes, not escaped twice after writing.
	if err := os.WriteFile(manifestPath, data, 0644); err != nil { fmt.Println("Erreur ecriture manifest:", err); os.Exit(1) }

	browsers := map[string]string{
		"Chrome": `HKCU\Software\Google\Chrome\NativeMessagingHosts\` + hostName,
		"Edge":   `HKCU\Software\Microsoft\Edge\NativeMessagingHosts\` + hostName,
		"Brave":  `HKCU\Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\` + hostName,
	}
	for browser, regPath := range browsers {
		if err := regAdd(regPath, manifestPath); err != nil {
			fmt.Println("Warning:", browser, "non configure:", err)
		} else {
			fmt.Println("OK:", browser, "configure")
		}
	}

	fmt.Println("")
	fmt.Println("DP_PROJECT_NAME est installé.")
	fmt.Println("Recharge l'extension Chrome puis clique sur Activer la presence.")
	fmt.Println("Dossier:", installDir)
	fmt.Println("Tu peux fermer cette fenetre.")
}
