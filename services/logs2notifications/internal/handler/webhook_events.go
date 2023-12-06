package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/uselagoon/lagoon/services/logs2notifications/internal/schema"
)

// WebhookData .
type WebhookData struct {
	Type        string   `json:"type"`
	Event       string   `json:"event"`
	Project     string   `json:"project"`
	Environment string   `json:"environment"`
	BuildName   string   `json:"buildName,omitempty"`
	Route       string   `json:"route,omitempty"`
	Routes      []string `json:"routes,omitempty"`
	LogLink     string   `json:"logLink,omitempty"`
}

// SendToWebhook .
func (h *Messaging) SendToWebhook(notification *Notification, webhook schema.NotificationWebhook) {
	message, err := h.processWebhookTemplate(notification)
	if err != nil {
		return
	}
	h.sendWebhookMessage(notification.Meta.ProjectName, *message, webhook)
}

func (h *Messaging) sendWebhookMessage(project string, data WebhookData, webhook schema.NotificationWebhook) {
	message, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", webhook.Webhook, bytes.NewBuffer(message))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(message)))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message to webhook: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Println(fmt.Sprintf("Sent %s message to webhook", data.Event))
	if err != nil {
		log.Printf("Error sending message to webhook for project %s: %v", project, err)
		return
	}
	defer resp.Body.Close()
	log.Println(fmt.Sprintf("Sent %s message to webhook for project %s", data.Event, project))
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
		data.Type = "DEPLOYMENT"
	case "deployError":
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
	"github:pull_request:opened:handled":           {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"gitlab:merge_request:opened:handled":          {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:opened:handled": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestOpened"}, //not in slack
	"bitbucket:pullrequest:created:handled":        {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestOpened"}, //not in teams

	"github:pull_request:synchronize:handled":      {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"gitlab:merge_request:updated:handled":         {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"bitbucket:pullrequest:updated:opened:handled": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestUpdated"}, //not in slack
	"bitbucket:pullrequest:updated:handled":        {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestUpdated"}, //not in teams

	"github:pull_request:closed:handled":      {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:fulfilled:handled": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:rejected:handled":  {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"gitlab:merge_request:closed:handled":     {Emoji: "ℹ️", Color: "#E8E8E8", Template: "mergeRequestClosed"},

	"github:delete:handled":    {Emoji: "ℹ️", Color: "#E8E8E8", Template: "deleteEnvironment"},
	"gitlab:remove:handled":    {Emoji: "ℹ️", Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in slack
	"bitbucket:delete:handled": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in slack
	"api:deleteEnvironment":    {Emoji: "ℹ️", Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in teams

	"github:push:handled":         {Emoji: "ℹ️", Color: "#E8E8E8", Template: "repoPushHandled"},
	"bitbucket:repo:push:handled": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "repoPushHandled"},
	"gitlab:push:handled":         {Emoji: "ℹ️", Color: "#E8E8E8", Template: "repoPushHandled"},

	"github:push:skipped":    {Emoji: "ℹ️", Color: "#E8E8E8", Template: "repoPushSkipped"},
	"gitlab:push:skipped":    {Emoji: "ℹ️", Color: "#E8E8E8", Template: "repoPushSkipped"},
	"bitbucket:push:skipped": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "repoPushSkipped"},

	"api:deployEnvironmentLatest": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "deployEnvironment"},
	"api:deployEnvironmentBranch": {Emoji: "ℹ️", Color: "#E8E8E8", Template: "deployEnvironment"},

	"task:deploy-openshift:finished":           {Emoji: "✅", Color: "good", Template: "deployFinished"},
	"task:remove-openshift-resources:finished": {Emoji: "✅", Color: "good", Template: "deployFinished"},
	"task:builddeploy-openshift:complete":      {Emoji: "✅", Color: "good", Template: "deployFinished"},
	"task:builddeploy-kubernetes:complete":     {Emoji: "✅", Color: "good", Template: "deployFinished"}, //not in teams

	"task:remove-openshift:finished":  {Emoji: "✅", Color: "good", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: "✅", Color: "good", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: "🛑", Color: "danger", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: "🛑", Color: "danger", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: "🛑", Color: "danger", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: "🛑", Color: "danger", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: "⚠️", Color: "warning", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: "⚠️", Color: "warning", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: "⚠️", Color: "warning", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: "⚠️", Color: "warning", Template: "notDeleted"},

	// deprecated
	// "rest:remove:CannotDeleteProductionEnvironment": {Emoji: "⚠️", Color: "warning"},
	// "rest:deploy:receive":                           {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:remove:receive":                           {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:promote:receive":                          {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:pullrequest:deploy":                       {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:pullrequest:remove":                       {Emoji: "ℹ️", Color: "#E8E8E8"},

	// deprecated
	// "task:deploy-openshift:error":           {Emoji: "🛑", Color: "danger", Template: "deployError"},
	// "task:remove-openshift-resources:error": {Emoji: "🛑", Color: "danger", Template: "deployError"},

	// deprecated
	// "task:deploy-openshift:retry":           {Emoji: "⚠️", Color: "warning", Template: "removeRetry"},
	// "task:remove-openshift:retry":           {Emoji: "⚠️", Color: "warning", Template: "removeRetry"},
	// "task:remove-kubernetes:retry":          {Emoji: "⚠️", Color: "warning", Template: "removeRetry"},
	// "task:remove-openshift-resources:retry": {Emoji: "⚠️", Color: "warning", Template: "removeRetry"},
}
