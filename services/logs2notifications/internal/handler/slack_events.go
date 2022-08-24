package handler

import (
	"bytes"
	"fmt"
	"log"
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
		slackTpl = `*[{{.ProjectName}}]* PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) opened in [{{.RepoName}}]({{.RepoURL}})`
	case "mergeRequestUpdated":
		slackTpl = `*[{{.ProjectName}}]* PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) updated in [{{.RepoName}}]({{.RepoURL}})`
	case "mergeRequestClosed":
		slackTpl = `*[{{.ProjectName}}]* PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) closed in [{{.RepoName}}]({{.RepoURL}})`
	case "deleteEnvironment":
		slackTpl = `*[{{.ProjectName}}]* Deleting environment ` + "`{{.EnvironmentName}}`"
	case "repoPushHandled":
		slackTpl = `*[{{.ProjectName}}]* [{{.BranchName}}]({{.RepoURL}}/tree/{{.BranchName}}){{ if ne .ShortSha "" }} ([{{.ShortSha}}]({{.CommitURL}})){{end}} pushed in [{{.RepoFullName}}]({{.RepoURL}})`
	case "repoPushSkipped":
		slackTpl = `*[{{.ProjectName}}]* [{{.BranchName}}]({{.RepoURL}}/tree/{{.BranchName}}){{ if ne .ShortSha "" }} ([{{.ShortSha}}]({{.CommitURL}})){{end}} pushed in [{{.RepoFullName}}]({{.RepoURL}}) *deployment skipped*`
	case "deployEnvironment":
		slackTpl = `*[{{.ProjectName}}]* Deployment triggered ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		slackTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "removeRetry":
		slackTpl = `*[{{.ProjectName}}]* Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "notDeleted":
		slackTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + ` not deleted. {{.Error}}`
	case "deployError":
		slackTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` Failed. {{if ne .LogLink ""}} <{{.LogLink}}|Logs>{{end}}`
	case "deployFinished":
		slackTpl = `*[{{.ProjectName}}]* ` + "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` Succeeded. {{if ne .LogLink ""}} <{{.LogLink}}|Logs>{{end}}
{{.Route}}{{range .Routes}}{{if ne . $.Route}}{{.}}{{end}}
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
	t.Execute(&slackMsg, notification.Meta)
	return emoji, color, slackMsg.String(), nil
}

func (h *Messaging) sendSlackMessage(emoji, color, appID, channel, webhook, event, message string) {
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
	defer resp.Body.Close()
	log.Println(fmt.Sprintf("Sent %s message to slack channel %s for project %s", event, channel, project))
}

func getSlackEvent(msgEvent string) (string, string, string, error) {
	if val, ok := slackEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var slackEventTypeMap = map[string]EventMap{
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
