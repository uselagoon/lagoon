package schema

import (
	"encoding/json"
	"fmt"
)

// Notifications represents possible Lagoon notification types.
// These are unmarshalled from a projectByName query response.
type Notifications struct {
	Slack          []NotificationSlack
	RocketChat     []NotificationRocketChat
	Email          []NotificationEmail
	MicrosoftTeams []NotificationMicrosoftTeams
	Webhook        []NotificationWebhook
}

// NotificationSlack is based on the Lagoon API type.
type NotificationSlack struct {
	Name    string `json:"name"`
	Webhook string `json:"webhook"`
	Channel string `json:"channel"`
}

// NotificationRocketChat is based on the Lagoon API type.
type NotificationRocketChat struct {
	Name    string `json:"name"`
	Webhook string `json:"webhook"`
	Channel string `json:"channel"`
}

// NotificationEmail is based on the Lagoon API type.
type NotificationEmail struct {
	Name         string `json:"name"`
	EmailAddress string `json:"emailAddress"`
}

// NotificationMicrosoftTeams is based on the Lagoon API type.
type NotificationMicrosoftTeams struct {
	Name    string `json:"name"`
	Webhook string `json:"webhook"`
}

// NotificationWebhook is based on the Lagoon API type.
type NotificationWebhook struct {
	Name                          string `json:"name"`
	Webhook                       string `json:"webhook"`
	ContentType                   string `json:"contentType"`
	NotificationSeverityThreshold string `json:"notificationSeverityThreshold"`
}

// UnmarshalJSON unmashals a quoted json string to the Notification values
// returned from the Lagoon API.
func (n *Notifications) UnmarshalJSON(b []byte) error {
	var nArray []map[string]string
	err := json.Unmarshal(b, &nArray)
	if err != nil {
		return err
	}
	for _, nMap := range nArray {
		if len(nMap) == 0 {
			// Unsupported notification type returns an empty map.
			// This happens when the lagoon API being targeted is actually a higher
			// version than configured.
			continue
		}
		switch nMap["__typename"] {
		case "NotificationSlack":
			n.Slack = append(n.Slack,
				NotificationSlack{
					Name:    nMap["name"],
					Webhook: nMap["webhook"],
					Channel: nMap["channel"],
				})
		case "NotificationRocketChat":
			n.RocketChat = append(n.RocketChat,
				NotificationRocketChat{
					Name:    nMap["name"],
					Webhook: nMap["webhook"],
					Channel: nMap["channel"],
				})
		case "NotificationEmail":
			n.Email = append(n.Email,
				NotificationEmail{
					Name:         nMap["name"],
					EmailAddress: nMap["emailAddress"],
				})
		case "NotificationMicrosoftTeams":
			n.MicrosoftTeams = append(n.MicrosoftTeams,
				NotificationMicrosoftTeams{
					Name:    nMap["name"],
					Webhook: nMap["webhook"],
				})
		case "NotificationWebhook":
			n.Webhook = append(n.Webhook,
				NotificationWebhook{
					Name:                          nMap["name"],
					Webhook:                       nMap["webhook"],
					ContentType:                   nMap["contentType"],
					NotificationSeverityThreshold: nMap["notificationSeverityThreshold"],
				})
		default:
			return fmt.Errorf("unknown notification type: %v", nMap["__typename"])
		}
	}
	return nil
}
