package discord

import "nowly.client/native/internal/contract"

type Activity struct {
	Name       string      `json:"name,omitempty"`
	Type       int         `json:"type"`
	Details    string      `json:"details,omitempty"`
	State      string      `json:"state,omitempty"`
	Timestamps *Timestamps `json:"timestamps,omitempty"`
	Assets     *Assets     `json:"assets,omitempty"`
}

type Timestamps struct {
	Start int64 `json:"start,omitempty"`
	End   int64 `json:"end,omitempty"`
}

type Assets struct {
	LargeImage string `json:"large_image,omitempty"`
	LargeText  string `json:"large_text,omitempty"`
	SmallImage string `json:"small_image,omitempty"`
	SmallText  string `json:"small_text,omitempty"`
}

func ActivityFromPresence(p contract.PresencePayload) Activity {
	activity := Activity{
		Name:    p.Name,
		Type:    p.Type,
		Details: p.Details,
		State:   p.State,
	}

	if p.StartTime > 0 || p.EndTime > 0 {
		ts := &Timestamps{}
		if p.StartTime > 0 {
			ts.Start = p.StartTime
		}
		if p.EndTime > 0 {
			ts.End = p.EndTime
		}
		activity.Timestamps = ts
	}

	if p.LargeImage != "" || p.LargeText != "" || p.SmallImage != "" || p.SmallText != "" {
		assets := &Assets{}
		if p.LargeImage != "" {
			assets.LargeImage = p.LargeImage
		}
		if p.LargeText != "" {
			assets.LargeText = p.LargeText
		}
		if p.SmallImage != "" {
			assets.SmallImage = p.SmallImage
		}
		if p.SmallText != "" {
			assets.SmallText = p.SmallText
		}
		activity.Assets = assets
	}

	return activity
}
