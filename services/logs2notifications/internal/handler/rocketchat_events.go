package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"text/template"
)

// RocketChatData .
type RocketChatData struct {
	Channel     string                 `json:"channel"`
	Attachments []RocketChatAttachment `json:"attachments"`
}

// RocketChatAttachment .
type RocketChatAttachment struct {
	Text   string                      `json:"text"`
	Color  string                      `json:"color"`
	Fields []RocketChatAttachmentField `json:"fields"`
}

// RocketChatAttachmentField .
type RocketChatAttachmentField struct {
	Short bool   `json:"short"`
	Title string `json:"title"`
	Value string `json:"value"`
}

// SendToRocketChat .
func (h *Messaging) SendToRocketChat(notification *Notification, channel, webhook, appID string) {
	emoji, color, message, err := h.processRocketChatTemplate(notification)
	if err != nil {
		return
	}
	h.sendRocketChatMessage(emoji, color, appID, channel, webhook, notification.Event, notification.Meta.ProjectName, message)
}

// SendToRocketChat .
func (h *Messaging) processRocketChatTemplate(notification *Notification) (string, string, string, error) {
	emoji, color, tpl, err := getRocketChatEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		if eventSplit[1] == "insert" {
			tpl = "problemNotification"
		}
	}

	var rcTpl string
	switch tpl {
	case "mergeRequestOpened":
		rcTpl = `*[{{.ProjectName}}]* PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) opened in [{{.RepoName}}]({{.RepoURL}})`
	case "mergeRequestUpdated":
		rcTpl = `*[{{.ProjectName}}]* PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) updated in [{{.RepoName}}]({{.RepoURL}})`
	case "mergeRequestClosed":
		rcTpl = `*[{{.ProjectName}}]* PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) closed in [{{.RepoName}}]({{.RepoURL}})`
	case "deleteEnvironment":
		rcTpl = `*[{{.ProjectName}}]* Deleting environment ` + "`{{.EnvironmentName}}`"
	case "repoPushHandled":
		rcTpl = `*[{{.ProjectName}}]* [{{.BranchName}}]({{.RepoURL}}/tree/{{.BranchName}}){{ if ne .ShortSha "" }} ([{{.ShortSha}}]({{.CommitURL}})){{end}} pushed in [{{.RepoFullName}}]({{.RepoURL}})`
	case "repoPushSkipped":
		rcTpl = `*[{{.ProjectName}}]* [{{.BranchName}}]({{.RepoURL}}/tree/{{.BranchName}}){{ if ne .ShortSha "" }} ([{{.ShortSha}}]({{.CommitURL}})){{end}} pushed in [{{.RepoFullName}}]({{.RepoURL}}) *deployment skipped*`
	case "deployEnvironment":
		rcTpl = `*[{{.ProjectName}}]* Deployment triggered {{ if ne .BranchName "" }}` + "`{{.BranchName}}`" + `{{else if ne .PullrequestTitle "" }}` + "`{{.PullrequestTitle}}`" + `{{end}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		rcTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "removeRetry":
		rcTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "notDeleted":
		rcTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + ` not deleted. {{.Error}}`
	case "deployError":
		rcTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` Failed. {{if ne .LogLink ""}} [Logs]({{.LogLink}}){{end}}`
	case "deployFinished":
		rcTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` Succeeded. {{if ne .LogLink ""}} [Logs]({{.LogLink}}){{end}}
* {{.Route}}{{range .Routes}}{{if ne . $.Route}}* {{.}}{{end}}
{{end}}`
	case "problemNotification":
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" && eventSplit[1] == "insert" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		rcTpl = `*[{{.ProjectName}}]* New problem found for ` + "`{{.EnvironmentName}}`" + `
* Service: ` + "`{{.ServiceName}}`" + `{{ if ne .Severity "" }}
* Severity: {{.Severity}}{{end}}{{ if ne .Description "" }}
* Description: {{.Description}}{{end}}`
	default:
		return "", "", "", fmt.Errorf("no matching event")
	}
	var rcMsg bytes.Buffer
	t, _ := template.New("rocketchat").Parse(rcTpl)
	err = t.Execute(&rcMsg, notification.Meta)
	if err != nil {
		return "", "", "", fmt.Errorf("error generating notifcation template for event %s and project %s: %v", notification.Event, notification.Meta.ProjectName, err)
	}
	return emoji, color, rcMsg.String(), nil
}

func (h *Messaging) sendRocketChatMessage(emoji, color, appID, channel, webhook, event, project, message string) {
	data := RocketChatData{
		Channel: channel,
		Attachments: []RocketChatAttachment{
			{
				Text:  fmt.Sprintf("%s %s", emoji, message),
				Color: color,
				Fields: []RocketChatAttachmentField{
					{
						Short: true,
						Title: "Source",
						Value: appID,
					},
				},
			},
		},
	}
	jsonBytes, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", webhook, bytes.NewBuffer(jsonBytes))
	if err != nil {
		log.Printf("Error sending message to rocketchat channel %s for project %s: %v", channel, project, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(jsonBytes)))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message to rocketchat channel %s for project %s: %v", channel, project, err)
		return
	}
	defer resp.Body.Close()
	log.Printf("Sent %s message to rocketchat channel %s for project %s", event, channel, project)
}

func getRocketChatEvent(msgEvent string) (string, string, string, error) {
	if val, ok := rocketChatEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var rocketChatEventTypeMap = map[string]EventMap{
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

	"task:deploy-openshift:finished":           {Emoji: "✅", Color: "lawngreen", Template: "deployFinished"},
	"task:remove-openshift-resources:finished": {Emoji: "✅", Color: "lawngreen", Template: "deployFinished"},
	"task:builddeploy-openshift:complete":      {Emoji: "✅", Color: "lawngreen", Template: "deployFinished"},
	"task:builddeploy-kubernetes:complete":     {Emoji: "✅", Color: "lawngreen", Template: "deployFinished"}, //not in teams

	"task:remove-openshift:finished":  {Emoji: "✅", Color: "lawngreen", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: "✅", Color: "lawngreen", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: "🛑", Color: "red", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: "🛑", Color: "red", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: "🛑", Color: "red", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: "🛑", Color: "red", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: "⚠️", Color: "gold", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: "⚠️", Color: "gold", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: "⚠️", Color: "gold", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: "⚠️", Color: "gold", Template: "notDeleted"},

	// deprecated
	// "rest:remove:CannotDeleteProductionEnvironment": {Emoji: "⚠️", Color: "gold"},
	// "rest:deploy:receive":                           {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:remove:receive":                           {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:promote:receive":                          {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:pullrequest:deploy":                       {Emoji: "ℹ️", Color: "#E8E8E8"},
	// "rest:pullrequest:remove":                       {Emoji: "ℹ️", Color: "#E8E8E8"},

	// deprecated
	// "task:deploy-openshift:error":           {Emoji: "🛑", Color: "red", Template: "deployError"},
	// "task:remove-openshift-resources:error": {Emoji: "🛑", Color: "red", Template: "deployError"},

	// deprecated
	// "task:deploy-openshift:retry":           {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
	// "task:remove-openshift:retry":           {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
	// "task:remove-kubernetes:retry":          {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
	// "task:remove-openshift-resources:retry": {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
}
