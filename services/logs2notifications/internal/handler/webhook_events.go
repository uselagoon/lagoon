package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strings"

	"github.com/uselagoon/machinery/api/schema"
)

// WebhookData .
type WebhookData struct {
	Type        string   `json:"type"`
	Event       string   `json:"event"`
	Project     string   `json:"project"`
	Environment string   `json:"environment"`
	BuildName   string   `json:"buildName,omitempty"`
	Warnings    bool     `json:"warnings,omitempty"`
	BuildStep   string   `json:"buildStep,omitempty"`
	Route       string   `json:"route,omitempty"`
	Routes      []string `json:"routes,omitempty"`
	LogLink     string   `json:"logLink,omitempty"`
}

// SendToWebhook .
func (h *Messaging) SendToWebhook(notification *Notification, webhook schema.AddNotificationWebhookInput) {
	message, err := h.processWebhookTemplate(notification)
	if err != nil {
		return
	}
	h.sendWebhookMessage(notification.Meta.ProjectName, *message, webhook)
}

func (h *Messaging) sendWebhookMessage(project string, data WebhookData, webhook schema.AddNotificationWebhookInput) {
	message, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", webhook.Webhook, bytes.NewBuffer(message))
	if err != nil {
		log.Printf("Error sending message to webhook: %v", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(message)))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message to webhook: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Printf("Sent %s message to webhook for project %s", data.Event, project)
}

// processWebhookTemplate .
func (h *Messaging) processWebhookTemplate(notification *Notification) (*WebhookData, error) {
	tpl, err := getWebhookEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return nil, fmt.Errorf("no matching event")
		}
		if eventSplit[1] == "insert" {
			tpl = "problemNotification"
		}
	}
	data := WebhookData{
		Event:       notification.Event,
		Project:     notification.Meta.ProjectName,
		Environment: notification.Meta.BranchName,
		BuildName:   notification.Meta.BuildName,
		Route:       notification.Meta.Route,
		Routes:      notification.Meta.Routes,
		LogLink:     notification.Meta.LogLink,
	}

	switch tpl {
	case "deployFinished":
		match, _ := regexp.MatchString(".*WithWarnings$", notification.Meta.BuildStep)
		if match {
			data.Warnings = true
		}
		data.Type = "DEPLOYMENT"
	case "deployError":
		data.BuildStep = notification.Meta.BuildStep
		data.Type = "DEPLOYMENT"
	default:
		return nil, fmt.Errorf("no matching event")
	}
	return &data, nil
}

func getWebhookEvent(msgEvent string) (string, error) {
	if val, ok := webhookEventTypeMap[msgEvent]; ok {
		return val.Template, nil
	}
	return "", fmt.Errorf("no matching event source")
}

var webhookEventTypeMap = map[string]EventMap{
	"github:pull_request:opened:handled":           {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"gitlab:merge_request:opened:handled":          {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:opened:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"}, //not in slack
	"bitbucket:pullrequest:created:handled":        {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"}, //not in teams

	"github:pull_request:synchronize:handled":      {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"gitlab:merge_request:updated:handled":         {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"bitbucket:pullrequest:updated:opened:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"}, //not in slack
	"bitbucket:pullrequest:updated:handled":        {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"}, //not in teams

	"github:pull_request:closed:handled":      {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:fulfilled:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:rejected:handled":  {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"gitlab:merge_request:closed:handled":     {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},

	"github:delete:handled":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"},
	"gitlab:remove:handled":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in slack
	"bitbucket:delete:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in slack
	"api:deleteEnvironment":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in teams

	"github:push:handled":         {Emoji: infoEmoji, Color: "#E8E8E8", Template: "repoPushHandled"},
	"bitbucket:repo:push:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "repoPushHandled"},
	"gitlab:push:handled":         {Emoji: infoEmoji, Color: "#E8E8E8", Template: "repoPushHandled"},

	"github:push:skipped":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "repoPushSkipped"},
	"gitlab:push:skipped":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "repoPushSkipped"},
	"bitbucket:push:skipped": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "repoPushSkipped"},

	"api:deployEnvironmentLatest": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deployEnvironment"},
	"api:deployEnvironmentBranch": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deployEnvironment"},

	"task:deploy-openshift:finished":           {Emoji: successEmoji, Color: "good", Template: "deployFinished"},
	"task:remove-openshift-resources:finished": {Emoji: successEmoji, Color: "good", Template: "deployFinished"},
	"task:builddeploy-openshift:complete":      {Emoji: successEmoji, Color: "good", Template: "deployFinished"},
	"task:builddeploy-kubernetes:complete":     {Emoji: successEmoji, Color: "good", Template: "deployFinished"}, //not in teams

	"task:remove-openshift:finished":  {Emoji: successEmoji, Color: "good", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: successEmoji, Color: "good", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: failEmoji, Color: "danger", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: failEmoji, Color: "danger", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: failEmoji, Color: "danger", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: failEmoji, Color: "danger", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
}
