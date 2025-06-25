package handler

import (
	"bytes"
	"log"
	"net/http"
    "io"
	"encoding/json"

	"github.com/uselagoon/machinery/api/schema"
)

// The supported structure of a Discord webhoook.
// See https://discord.com/developers/docs/resources/webhook#execute-webhook
type DiscordExecuteWebhookParams struct {
	Content      string    `json:"content,omitempty"`
	Username     string    `json:"username,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
}

func (h *Messaging) SendToDiscord(notification *Notification, webhook schema.AddNotificationDiscordInput) {

	
	content, _    := json.MarshalIndent(notification, "", "  ")
	username   := "LeBron James"

	data := DiscordExecuteWebhookParams{
		Content: string(content),
		Username: username,
	}

	h.sendDiscordMessage(notification.Meta.ProjectName, data, webhook)
}

func (h *Messaging) sendDiscordMessage(project string, data DiscordExecuteWebhookParams, webhook schema.AddNotificationDiscordInput) {
	message, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", webhook.Webhook, bytes.NewBuffer(message))
	if err != nil {
		log.Printf("Error sending message to webhook: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message to webhook: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Printf("Sent message to webhook for project %s", project)

	// Read and log the response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read response body: %v", err)
	}

	// Log status code and response body
	log.Printf("Response Status: %s", resp.Status)
	log.Printf("Response Headers: %v", resp.Header)
	log.Printf("Response Body: %s", bytes.TrimSpace(body))
}
