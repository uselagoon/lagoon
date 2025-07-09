package handler

import (
	"bytes"
	"fmt"
	"log"
	"net/http"
	"encoding/json"
	"text/template"
	"strings"
	"regexp"

	"github.com/uselagoon/machinery/api/schema"
)

// The supported structure of a Discord webhoook.
// Discord has many available JSON form parameters, but we only support a small number of them for the moment.
// See https://discord.com/developers/docs/resources/webhook#execute-webhook
type DiscordExecuteWebhookParams struct {
	Content      string    `json:"content,omitempty"`
	Username     string    `json:"username,omitempty"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
}

func (h *Messaging) SendToDiscord(notification *Notification, webhook schema.AddNotificationDiscordInput) {
	params, err := h.processDiscordWebhookTemplate(notification)
	if err != nil {
		return
	}
	h.sendDiscordMessage(notification.Meta.ProjectName, params, webhook)
}

func (h *Messaging) processDiscordWebhookTemplate(notification *Notification) (DiscordExecuteWebhookParams, error) {
	_, _, message, err := getDiscordContent(notification)
	username   := "Lagoon"

	data := DiscordExecuteWebhookParams{
		Content: message,
		Username: username,
	}
	
	return data, err
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
}

func getDiscordContent(notification *Notification) (string, string, string, error) {
	emoji, color, tpl, err := getDiscordEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		if eventSplit[1] == "insert" {
			tpl = "problemNotification"
		}
	}

	var discordTpl string
	switch tpl {
	case "mergeRequestOpened":
		discordTpl = `*[{{.ProjectName}}]* PR <{{.PullrequestURL}}|#{{.PullrequestNumber}} ({{.PullrequestTitle}})> opened in <{{.RepoURL}}|{{.RepoName}}>`
	case "mergeRequestUpdated":
		discordTpl = `*[{{.ProjectName}}]* PR <{{.PullrequestURL}}|#{{.PullrequestNumber}} ({{.PullrequestTitle}})> updated in <{{.RepoURL}}|{{.RepoName}}>`
	case "mergeRequestClosed":
		discordTpl = `*[{{.ProjectName}}]* PR <{{.PullrequestURL}}|#{{.PullrequestNumber}} ({{.PullrequestTitle}})> closed in <{{.RepoURL}}|{{.RepoName}}>`
	case "deleteEnvironment":
		discordTpl = `*[{{.ProjectName}}]* Deleting environment ` + "`{{.EnvironmentName}}`"
	case "repoPushHandled":
		discordTpl = `*[{{.ProjectName}}]* <{{.RepoURL}}/tree/{{.BranchName}}|{{.BranchName}}>{{ if ne .ShortSha "" }} (<{{.CommitURL}}|{{.ShortSha}}>){{end}} pushed in <{{.RepoURL}}|{{.RepoFullName}}>`
	case "repoPushSkipped":
		discordTpl = `*[{{.ProjectName}}]* <{{.RepoURL}}/tree/{{.BranchName}}|{{.BranchName}}>{{ if ne .ShortSha "" }} (<{{.CommitURL}}|{{.ShortSha}}>){{end}} pushed in <{{.RepoURL}}|{{.RepoFullName}}> *deployment skipped*`
	case "deployEnvironment":
		discordTpl = `*[{{.ProjectName}}]* Deployment triggered {{ if ne .BranchName "" }}` + "`{{.BranchName}}`" + `{{else if ne .PullrequestTitle "" }}` + "`{{.PullrequestTitle}}`" + `{{end}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		discordTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "removeRetry":
		discordTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "notDeleted":
		discordTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + ` not deleted. {{.Error}}`
	case "deployError":
		discordTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` failed at build step ` + "`{{.BuildStep}}`" + `. {{if ne .LogLink ""}} <{{.LogLink}}|Logs>{{end}}`
	case "deployFinished":
		match, _ := regexp.MatchString(".*WithWarnings$", notification.Meta.BuildStep)
		msg := "Succeeded"
		if match {
			emoji = warningEmoji
			msg = "Succeeded with warnings, check the build log for more information"
		}
		discordTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}` " + msg + `. {{if ne .LogLink ""}} <{{.LogLink}}|Logs>{{end}}
{{.Route}}
{{range .Routes}}{{if ne . $.Route}}{{.}}{{end}}
{{end}}`
	case "problemNotification":
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" && eventSplit[1] == "insert" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		discordTpl = `*[{{.ProjectName}}]* New problem found for ` + "`{{.EnvironmentName}}`" + `
* Service: ` + "`{{.ServiceName}}`" + `{{ if ne .Severity "" }}
* Severity: {{.Severity}}{{end}}{{ if ne .Description "" }}
* Description: {{.Description}}{{end}}`
	default:
		return "", "", "", fmt.Errorf("no matching event")
	}


	var discordMsg bytes.Buffer
	t, _ := template.New("discord").Parse(discordTpl)
	err = t.Execute(&discordMsg, notification.Meta)
	if err != nil {
		return "", "", "", fmt.Errorf("error generating notifcation template for event %s and project %s: %v", notification.Event, notification.Meta.ProjectName, err)
	}
	return emoji, color, discordMsg.String(), nil
}


func getDiscordEvent(msgEvent string) (string, string, string, error) {
	if val, ok := discordEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var discordEventTypeMap = map[string]EventMap{
	"github:pull_request:opened:handled":           {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"gitlab:merge_request:opened:handled":          {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:opened:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:handled":        {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestOpened"}, 

	"github:pull_request:synchronize:handled":      {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"gitlab:merge_request:updated:handled":         {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"bitbucket:pullrequest:updated:opened:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"}, 
	"bitbucket:pullrequest:updated:handled":        {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestUpdated"}, 

	"github:pull_request:closed:handled":      {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:fulfilled:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:rejected:handled":  {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"gitlab:merge_request:closed:handled":     {Emoji: infoEmoji, Color: "#E8E8E8", Template: "mergeRequestClosed"},

	"github:delete:handled":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"},
	"gitlab:remove:handled":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"}, 
	"bitbucket:delete:handled": {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"}, 
	"api:deleteEnvironment":    {Emoji: infoEmoji, Color: "#E8E8E8", Template: "deleteEnvironment"}, 

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
	"task:builddeploy-kubernetes:complete":     {Emoji: successEmoji, Color: "good", Template: "deployFinished"}, 

	"task:remove-openshift:finished":  {Emoji: successEmoji, Color: "good", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: successEmoji, Color: "good", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: failEmoji, Color: "danger", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: failEmoji, Color: "danger", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: failEmoji, Color: "danger", Template: "deployError"}, 
	"task:builddeploy-openshift:failed":  {Emoji: failEmoji, Color: "danger", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: warningEmoji, Color: "warning", Template: "notDeleted"},
}

