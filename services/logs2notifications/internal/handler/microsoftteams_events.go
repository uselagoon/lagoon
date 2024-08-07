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

// MicrosoftTeamsData .
type MicrosoftTeamsData struct {
	Type       string                  `json:"@type"`
	Context    string                  `json:"@context"`
	Summary    string                  `json:"summary"`
	Title      string                  `json:"title"`
	ThemeColor string                  `json:"themeColor"`
	Sections   []MicrosoftTeamsSection `json:"sections"`
}

// MicrosoftTeamsSection .
type MicrosoftTeamsSection struct {
	ActivityText  string `json:"activityText"`
	ActivityImage string `json:"activityImage"`
}

// SendToMicrosoftTeams .
func (h *Messaging) SendToMicrosoftTeams(notification *Notification, webhook string) {
	emoji, color, message, err := h.processMicrosoftTeamsTemplate(notification)
	if err != nil {
		return
	}
	h.sendMicrosoftTeamsMessage(emoji, color, webhook, notification.Event, notification.Meta.ProjectName, message)
}

// processMicrosoftTeamsTemplate .
func (h *Messaging) processMicrosoftTeamsTemplate(notification *Notification) (string, string, string, error) {
	emoji, color, tpl, err := getMicrosoftTeamsEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		if eventSplit[1] == "insert" {
			tpl = "problemNotification"
		}
	}

	var teamsTpl string
	switch tpl {
	case "mergeRequestOpened":
		teamsTpl = `PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) opened in [{{.RepoName}}]({{.RepoURL}})`
	case "mergeRequestUpdated":
		teamsTpl = `PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) updated in [{{.RepoName}}]({{.RepoURL}})`
	case "mergeRequestClosed":
		teamsTpl = `PR [#{{.PullrequestNumber}} ({{.PullrequestTitle}})]({{.PullrequestURL}}) closed in [{{.RepoName}}]({{.RepoURL}})`
	case "deleteEnvironment":
		teamsTpl = `Deleting environment ` + "`{{.EnvironmentName}}`"
	case "repoPushHandled":
		teamsTpl = `[{{.BranchName}}]({{.RepoURL}}/tree/{{.BranchName}}){{ if ne .ShortSha "" }} ([{{.ShortSha}}]({{.CommitURL}})){{end}} pushed in [{{.RepoFullName}}]({{.RepoURL}})`
	case "repoPushSkipped":
		teamsTpl = `[{{.BranchName}}]({{.RepoURL}}/tree/{{.BranchName}}){{ if ne .ShortSha "" }} ([{{.ShortSha}}]({{.CommitURL}})){{end}} pushed in [{{.RepoFullName}}]({{.RepoURL}}) *deployment skipped*`
	case "deployEnvironment":
		teamsTpl = `Deployment triggered {{ if ne .BranchName "" }}` + "`{{.BranchName}}`" + `{{else if ne .PullrequestTitle "" }}` + "`{{.PullrequestTitle}}`" + `{{end}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		teamsTpl = `Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "removeRetry":
		teamsTpl = `Removed ` + "`{{.OpenshiftProject}}`" + ``
	case "notDeleted":
		teamsTpl = "`{{.BranchName}}`" + ` not deleted. {{.Error}}`
	case "deployError":
		teamsTpl = "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` Failed. {{if ne .LogLink ""}} [Logs]({{.LogLink}}){{end}}`
	case "deployFinished":
		teamsTpl = "`{{.BranchName}}`" + `{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build ` + "`{{.BuildName}}`" + ` Succeeded. {{if ne .LogLink ""}} [Logs]({{.LogLink}}){{end}}
* {{.Route}}{{range .Routes}}{{if ne . $.Route}}* {{.}}{{end}}
{{end}}`
	case "problemNotification":
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" && eventSplit[1] == "insert" {
			return "", "", "", fmt.Errorf("no matching event")
		}
		teamsTpl = `*[{{.ProjectName}}]* New problem found for ` + "`{{.EnvironmentName}}`" + `
* Service: ` + "`{{.ServiceName}}`" + `{{ if ne .Severity "" }}
* Severity: {{.Severity}}{{end}}{{ if ne .Description "" }}
* Description: {{.Description}}{{end}}`
	default:
		return "", "", "", fmt.Errorf("no matching event")
	}

	var teamsMsg bytes.Buffer
	t, _ := template.New("microsoftteams").Parse(teamsTpl)
	err = t.Execute(&teamsMsg, notification.Meta)
	if err != nil {
		return "", "", "", fmt.Errorf("error generating notifcation template for event %s and project %s: %v", notification.Event, notification.Meta.ProjectName, err)
	}
	return emoji, color, teamsMsg.String(), nil
}

func (h *Messaging) sendMicrosoftTeamsMessage(emoji, color, webhook, event, project, message string) {
	teamsPayload := MicrosoftTeamsData{
		Type:       "MessageCard",
		Context:    "http://schema.org/extensions",
		Summary:    message,
		Title:      project,
		ThemeColor: color,
		Sections: []MicrosoftTeamsSection{
			{
				ActivityText:  message,
				ActivityImage: emoji,
			},
		},
	}

	teamsPayloadBytes, _ := json.Marshal(teamsPayload)
	req, err := http.NewRequest("POST", webhook, bytes.NewBuffer(teamsPayloadBytes))
	if err != nil {
		log.Printf("Error sending message to microsoft teams for project %s: %v", project, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message to microsoft teams for project %s: %v", project, err)
		return
	}
	defer resp.Body.Close()
	log.Printf("Sent %s message to microsoft teams for project %s", event, project)
}

func getMicrosoftTeamsEvent(msgEvent string) (string, string, string, error) {
	if val, ok := microsoftTeamsEvent[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var microsoftTeamsEvent = map[string]EventMap{
	"github:pull_request:opened:handled":           {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"gitlab:merge_request:opened:handled":          {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:opened:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"}, //not in slack
	"bitbucket:pullrequest:created:handled":        {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"}, //not in teams

	"github:pull_request:synchronize:handled":      {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"gitlab:merge_request:updated:handled":         {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"bitbucket:pullrequest:updated:opened:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"}, //not in slack
	"bitbucket:pullrequest:updated:handled":        {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"}, //not in teams

	"github:pull_request:closed:handled":      {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:fulfilled:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:rejected:handled":  {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"gitlab:merge_request:closed:handled":     {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},

	"github:delete:handled":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"},
	"gitlab:remove:handled":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in slack
	"bitbucket:delete:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in slack
	"api:deleteEnvironment":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"}, //not in teams

	"github:push:handled":         {Emoji: ":information_source:", Color: "#E8E8E8", Template: "repoPushHandled"},
	"bitbucket:repo:push:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "repoPushHandled"},
	"gitlab:push:handled":         {Emoji: ":information_source:", Color: "#E8E8E8", Template: "repoPushHandled"},

	"github:push:skipped":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "repoPushSkipped"},
	"gitlab:push:skipped":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "repoPushSkipped"},
	"bitbucket:push:skipped": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "repoPushSkipped"},

	"api:deployEnvironmentLatest": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deployEnvironment"},
	"api:deployEnvironmentBranch": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deployEnvironment"},

	"task:deploy-openshift:finished":           {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "deployFinished"},
	"task:remove-openshift-resources:finished": {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "deployFinished"},
	"task:builddeploy-openshift:complete":      {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "deployFinished"},
	"task:builddeploy-kubernetes:complete":     {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "deployFinished"}, //not in teams

	"task:remove-openshift:finished":  {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: ":bangbang:", Color: "red", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: ":bangbang:", Color: "red", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},

	// deprecated
	// "rest:remove:CannotDeleteProductionEnvironment": {Emoji: ":warning:", Color: "gold"},
	// "rest:deploy:receive":                           {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:remove:receive":                           {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:promote:receive":                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:pullrequest:deploy":                       {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:pullrequest:remove":                       {Emoji: ":information_source:", Color: "#E8E8E8"},

	// deprecated
	// "task:deploy-openshift:error":           {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	// "task:remove-openshift-resources:error": {Emoji: ":bangbang:", Color: "red", Template: "deployError"},

	// deprecated
	// "task:deploy-openshift:retry":           {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
	// "task:remove-openshift:retry":           {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
	// "task:remove-kubernetes:retry":          {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
	// "task:remove-openshift-resources:retry": {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
}
