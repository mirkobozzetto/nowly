package discord

import (
	"testing"

	"nowly.client/native/internal/contract"
)

func TestActivityFromPresence(t *testing.T) {
	activity := ActivityFromPresence(contract.PresencePayload{
		Details:    "Watching",
		State:      "Episode 1",
		StartTime:  123,
		LargeImage: "youtube",
		LargeText:  "YouTube",
	})

	if activity.Details != "Watching" || activity.State != "Episode 1" {
		t.Fatalf("unexpected activity text: %+v", activity)
	}
	if activity.Timestamps == nil || activity.Timestamps.Start != 123 {
		t.Fatalf("unexpected timestamps: %+v", activity.Timestamps)
	}
	if activity.Assets == nil || activity.Assets.LargeImage != "youtube" || activity.Assets.LargeText != "YouTube" {
		t.Fatalf("unexpected assets: %+v", activity.Assets)
	}
}

func TestActivityFromPresenceWithButtons(t *testing.T) {
	activity := ActivityFromPresence(contract.PresencePayload{
		Name:    "YouTube",
		Details: "Watching a video",
		Buttons: []contract.PresenceButton{
			{Label: "Watch Video", URL: "https://youtube.com/watch?v=abc123"},
		},
	})

	if len(activity.Buttons) != 1 {
		t.Fatalf("expected 1 button, got %d", len(activity.Buttons))
	}
	if activity.Buttons[0].Label != "Watch Video" || activity.Buttons[0].URL != "https://youtube.com/watch?v=abc123" {
		t.Fatalf("unexpected button: %+v", activity.Buttons[0])
	}
}

func TestActivityFromPresenceSkipsEmptyButtons(t *testing.T) {
	activity := ActivityFromPresence(contract.PresencePayload{
		Buttons: []contract.PresenceButton{
			{Label: "", URL: ""},
		},
	})

	if len(activity.Buttons) != 0 {
		t.Fatalf("expected 0 buttons, got %d", len(activity.Buttons))
	}
}

func TestDiscordImageKeyPreservesAssetKey(t *testing.T) {
	result := discordImageKey("youtube")
	if result != "youtube" {
		t.Fatalf("expected 'youtube', got %q", result)
	}
}

func TestDiscordImageKeyPrefixesExternalUrl(t *testing.T) {
	result := discordImageKey("https://cdn.nowly.me/presences/youtube/assets/logo.png")
	expected := "mp:external/https://cdn.nowly.me/presences/youtube/assets/logo.png"
	if result != expected {
		t.Fatalf("expected %q, got %q", expected, result)
	}
}

func TestDiscordImageKeySkipsAlreadyPrefixed(t *testing.T) {
	result := discordImageKey("mp:external/https://cdn.nowly.me/presences/youtube/assets/logo.png")
	expected := "mp:external/https://cdn.nowly.me/presences/youtube/assets/logo.png"
	if result != expected {
		t.Fatalf("expected %q, got %q", expected, result)
	}
}
