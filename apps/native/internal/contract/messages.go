package contract

const (
	HostName           = "nowly.client"
	InstallFolderName  = "NowlyClient"
	ExtensionID        = "bafaggcgbadajaa1jbqbmsdkmaoafqcy"
	DiscordClientID    = "1510223984392671302"
	HostExecutableName = "nowly-host.exe"
	UninstallerName    = "nowly-uninstaller.exe"
)

type MessageType string

const (
	MessagePing          MessageType = "PING"
	MessageSetActivity   MessageType = "SET_ACTIVITY"
	MessageClearActivity MessageType = "CLEAR_ACTIVITY"
)

type ResponseType string

const (
	ResponsePong      ResponseType = "PONG"
	ResponseConnected ResponseType = "CONNECTED"
	ResponseOK        ResponseType = "OK"
	ResponseError     ResponseType = "ERROR"
)

type NativeMessage struct {
	Type     MessageType      `json:"type"`
	Presence *PresencePayload `json:"presence,omitempty"`
}

type PresencePayload struct {
	Name       string `json:"name,omitempty"`
	Details    string `json:"details,omitempty"`
	State      string `json:"state,omitempty"`
	StartTime  int64  `json:"startTime,omitempty"`
	EndTime    int64  `json:"endTime,omitempty"`
	LargeImage string `json:"largeImage,omitempty"`
	LargeText  string `json:"largeText,omitempty"`
	SmallImage string `json:"smallImage,omitempty"`
	SmallText  string `json:"smallText,omitempty"`
	Type       int    `json:"type,omitempty"`
}

type NativeResponse struct {
	Type      ResponseType `json:"type"`
	Connected bool         `json:"connected,omitempty"`
	Discord    bool         `json:"discordConnected,omitempty"`
	Status    string       `json:"status,omitempty"`
	Profile   *DiscordProfile `json:"profile,omitempty"`
	Error     string       `json:"error,omitempty"`
}

type DiscordProfile struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	GlobalName string `json:"globalName,omitempty"`
	Avatar     string `json:"avatar,omitempty"`
}

func Pong(connected bool, status string) NativeResponse {
	return NativeResponse{Type: ResponsePong, Connected: connected, Status: status}
}

func PongWithProfile(connected bool, discordConnected bool, status string, profile *DiscordProfile) NativeResponse {
	return NativeResponse{Type: ResponsePong, Connected: connected, Discord: discordConnected, Status: status, Profile: profile}
}

func Connected() NativeResponse {
	return NativeResponse{Type: ResponseConnected}
}

func OK() NativeResponse {
	return NativeResponse{Type: ResponseOK}
}

func Error(message string) NativeResponse {
	return NativeResponse{Type: ResponseError, Error: message}
}
