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
