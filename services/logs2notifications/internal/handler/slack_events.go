package handler

import (
	"bytes"
	"fmt"
	"log"
	"regexp"
	"strings"
	"text/template"

	"github.com/slack-go/slack"
)

// SendToSlack .
func (h *Messaging) SendToSlack(notification *Notification, channel, webhook, appID string) {
	emoji, color, message, err := h.processSlackTemplate(notification)
	if err != nil {
		return
	}
	h.sendSlackMessage(emoji, color, appID, channel, webhook, notification.Event, notification.Meta.ProjectName, message)
}

// processSlackTemplate .
func (h *Messaging) processSlackTemplate(notification *Notification) (string, string, string, error) {
	emoji, color, tpl, err := getSlackEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		if eventSplit[1] == "insert" {
			tpl = "problemNotification"
		}
	}

	var slackTpl string
	switch tpl {
	case "mergeRequestOpened":
		slackTpl = `*[{{.ProjectName}}]* PR <{{.PullrequestURL}}|#{{.PullrequestNumber}} ({{.PullrequestTitle}})> opened in <{{.RepoURL}}|{{.RepoName}}>`
	case "mergeRequestUpdated":
		slackTpl = `*[{{.ProjectName}}]* PR <{{.PullrequestURL}}|#{{.PullrequestNumber}} ({{.PullrequestTitle}})> updated in <{{.RepoURL}}|{{.RepoName}}>`
	case "mergeRequestClosed":
		slackTpl = `*[{{.ProjectName}}]* PR <{{.PullrequestURL}}|#{{.PullrequestNumber}} ({{.PullrequestTitle}})> closed in <{{.RepoURL}}|{{.RepoName}}>`
	case "deleteEnvironment":
		slackTpl = `*[{{.ProjectName}}]* Deleting environment ` + "`{{.EnvironmentName}}`"
	case "repoPushHandled":
		slackTpl = `*[{{.ProjectName}}]* <{{.RepoURL}}/tree/{{.BranchName}}|{{.BranchName}}>{{ if ne .ShortSha "" }} (<{{.CommitURL}}|{{.ShortSha}}>){{end}} pushed in <{{.RepoURL}}|{{.RepoFullName}}>`
	case "repoPushSkipped":
		slackTpl = `*[{{.ProjectName}}]* <{{.RepoURL}}/tree/{{.BranchName}}|{{.BranchName}}>{{ if ne .ShortSha "" }} (<{{.CommitURL}}|{{.ShortSha}}>){{end}} pushed in <{{.RepoURL}}|{{.RepoFullName}}> *deployment skipped*`
	case "deployEnvironment":
		slackTpl = `*[{{.ProjectName}}]* Deployment triggered {{ if ne .BranchName "" }}` + "`{{.BranchName}}`" + `{{else if ne .PullrequestTitle "" }}` + "`{{.PullrequestTitle}}`" + `{{end}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		slackTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "removeRetry":
		slackTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "notDeleted":
		slackTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + ` not deleted. {{.Error}}`
	case "deployError":
		slackTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` failed at build step ` + "`{{.BuildStep}}`" + `. {{if ne .LogLink ""}} <{{.LogLink}}|Logs>{{end}}`
	case "deployFinished":
		match, _ := regexp.MatchString(".*WithWarnings$", notification.Meta.BuildStep)
		msg := "Succeeded"
		if match {
			emoji = warningEmoji
			msg = "Succeeded with warnings, check the build log for more information"
		}
		slackTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}` " + msg + `. {{if ne .LogLink ""}} <{{.LogLink}}|Logs>{{end}}
{{.Route}}
{{range .Routes}}{{if ne . $.Route}}{{.}}{{end}}
{{end}}`
	case "problemNotification":
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" && eventSplit[1] == "insert" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		slackTpl = `*[{{.ProjectName}}]* New problem found for ` + "`{{.EnvironmentName}}`" + `
* Service: ` + "`{{.ServiceName}}`" + `{{ if ne .Severity "" }}
* Severity: {{.Severity}}{{end}}{{ if ne .Description "" }}
* Description: {{.Description}}{{end}}`
	default:
		return "", "", "", fmt.Errorf("no matching event")
	}

	var slackMsg bytes.Buffer
	t, _ := template.New("slack").Parse(slackTpl)
	err = t.Execute(&slackMsg, notification.Meta)
	if err != nil {
		return "", "", "", fmt.Errorf("error generating notifcation template for event %s and project %s: %v", notification.Event, notification.Meta.ProjectName, err)
	}
	return emoji, color, slackMsg.String(), nil
}

func (h *Messaging) sendSlackMessage(emoji, color, appID, channel, webhook, event, project, message string) {
	attachment := slack.Attachment{
		Text:       fmt.Sprintf("%s %s", emoji, message),
		Color:      color,
		Footer:     appID,
		MarkdownIn: []string{"pretext", "text", "fields"},
	}
	postMsg := slack.WebhookMessage{
		Attachments: []slack.Attachment{attachment},
		Channel:     channel,
	}

	err := slack.PostWebhook(webhook, &postMsg)
	if err != nil {
		// just log any errors
		log.Printf("Error sending message to slack channel %s for project %s: %v", channel, project, err)
		return
	}
	log.Printf("Sent %s message to slack channel %s for project %s", event, channel, project)
}

func getSlackEvent(msgEvent string) (string, string, string, error) {
	if val, ok := slackEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var slackEventTypeMap = map[string]EventMap{
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
