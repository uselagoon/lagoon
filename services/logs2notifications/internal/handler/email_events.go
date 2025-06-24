package handler

import (
	"bytes"
	"fmt"
	"log"
	"regexp"
	"strings"
	"text/template"
)

var htmlTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>{{.Title}}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0 " />
  <style>
	@import url('https://fonts.googleapis.com/css?family=Roboto&display=swap');
	body {
	  font-family: 'Roboto', sans-serif;
	}
	.main{
	  border-left: 10px solid {{.Color}};
	  padding: 10px;
	}
	ul {
	  margin: 2px;
	  list-style-type:none;
	}
  </style>
</head>
<body>
  <div class="main">
	<h2><strong>{{.Emoji}} [{{.ProjectName}}]</strong></h2>
	<p>
	    {{.MainHTML}}
	</p>
  </div>
</body>
</html>`

// SendToEmail .
func (h *Messaging) SendToEmail(notification *Notification, emailAddress string) {
	emoji, color, subject, mainHTML, plainText, err := h.processEmailTemplates(notification)
	if err != nil {
		return
	}
	h.prepareAndSendEmail(emoji, color, subject, notification.Event, notification.Meta.ProjectName, emailAddress, mainHTML, plainText)
}

// SendToEmail .
func (h *Messaging) processEmailTemplates(notification *Notification) (string, string, string, string, string, error) {

	emoji, color, tpl, err := getEmailEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return "", "", "", "", "", fmt.Errorf("no matching event")
		}
		if eventSplit[1] == "insert" {
			tpl = "problemNotification"
		}
	}
	var mainHTML, plainText, subject, plainTextTpl, mainHTMLTpl string
	switch tpl {
	case "mergeRequestOpened":
		mainHTMLTpl = `PR <a href="{{.PullrequestNumber}}">#{{.PullrequestNumber}} ({{.PullrequestTitle}})</a> opened in <a href="{{.RepoURL}}">{{.RepoName}}</a>`
		plainTextTpl = `[{{.ProjectName}}] PR #{{.PullrequestNumber}} - {{.PullrequestTitle}} opened in {{.RepoName}}`
	case "mergeRequestUpdated":
		mainHTMLTpl = `PR <a href="{{.PullrequestNumber}}">#{{.PullrequestNumber}} ({{.PullrequestTitle}})</a> updated in <a href="{{.RepoURL}}">{{.RepoName}}</a>`
		plainTextTpl = `[{{.ProjectName}}] PR #{{.PullrequestNumber}} - {{.PullrequestTitle}} updated in {{.RepoName}}`
	case "mergeRequestClosed":
		mainHTMLTpl = `PR <a href="{{.PullrequestNumber}}">#{{.PullrequestNumber}} ({{.PullrequestTitle}})</a> closed in <a href="{{.RepoURL}}">{{.RepoName}}</a>`
		plainTextTpl = `[{{.ProjectName}}] PR #{{.PullrequestNumber}} - {{.PullrequestTitle}} closed in {{.RepoName}}`
	case "deleteEnvironment":
		mainHTMLTpl = `Deleted environment <code>{{.EnvironmentName}}</code>`
		plainTextTpl = `[{{.ProjectName}}] deleted environment {{.EnvironmentName}}`
	case "repoPushHandled":
		mainHTMLTpl = `<a href="{{.RepoURL}}/tree/{{.BranchName}}">{{.BranchName}}</a>{{ if ne .ShortSha "" }} <a href="{{.CommitURL}}">{{.ShortSha}}</a>{{end}} pushed in <a href="{{.RepoURL}}">{{.RepoFullName}}</a>`
		plainTextTpl = `[{{.ProjectName}}] {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} pushed in {{.RepoFullName}}`
	case "repoPushSkipped":
		mainHTMLTpl = `<a href="{{.RepoURL}}/tree/{{.BranchName}}">{{.BranchName}}</a>{{ if ne .ShortSha "" }} <a href="{{.CommitURL}}">{{.ShortSha}}</a>{{end}} pushed in <a href="{{.RepoURL}}">{{.RepoFullName}}</a> <strong>deployment skipped</strong>`
		plainTextTpl = `[{{.ProjectName}}] {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} pushed in {{.RepoFullName}} *deployment skipped*`
	case "deployEnvironment":
		mainHTMLTpl = `Deployment triggered <code>{{ if ne .BranchName "" }}{{.BranchName}}{{else if ne .PullrequestTitle "" }}{{.PullrequestTitle}}{{end}}</code>{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
		plainTextTpl = `[{{.ProjectName}}] Deployment triggered on branch {{ if ne .BranchName "" }}{{.BranchName}}{{else if ne .PullrequestTitle "" }}{{.PullrequestTitle}}{{end}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		mainHTMLTpl = `Remove <code>{{.OpenshiftProject}}</code>`
		plainTextTpl = `[{{.ProjectName}}] remove {{.OpenshiftProject}}`
	case "notDeleted":
		mainHTMLTpl = `<code>{{.OpenshiftProject}}</code> not deleted.`
		plainTextTpl = `[{{.ProjectName}}] {{.OpenshiftProject}} not deleted. {{.Error}}`
	case "deployError":
		mainHTMLTpl = `[{{.ProjectName}}] <code>{{.BranchName}}</code>{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build <code>{{.BuildName}}</code> failed at build step ` + "`{{.BuildStep}}`" + `.
{{if ne .LogLink ""}} <a href="{{.LogLink}}">Logs</a>{{end}}`
		plainTextTpl = `[{{.ProjectName}}] {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build {{.BuildName}} failed at build step {{.BuildStep}}.
{{if ne .LogLink ""}} [Logs]({{.LogLink}}){{end}}`
		subject += fmt.Sprintf("[%s] %s Build %s error.",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
			notification.Meta.BuildName,
		)
	case "deployFinished":
		match, _ := regexp.MatchString(".*WithWarnings$", notification.Meta.BuildStep)
		msg := "completed"
		if match {
			emoji = warningEmoji
			msg = "completed with warnings, check the build log for more information"
		}
		mainHTMLTpl = `[{{.ProjectName}}] <code>{{.BranchName}}</code>{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build <code>{{.BuildName}}</code> ` + msg + `. {{if ne .LogLink ""}}<a href="{{.LogLink}}">Logs</a>{{end}}
</p>
</div>
<div>
<p>
<ul>
<li><a href="{{.Route}}">{{.Route}}</a></li>
{{range .Routes}}{{if ne . $.Route}}<li><a href="{{.}}">{{.}}</a></li>
{{end}}{{end}}</ul>`
		plainTextTpl = `[{{.ProjectName}}] {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build {{.BuildName}} ` + msg + `. {{if ne .LogLink ""}}[Logs]({{.LogLink}}){{end}}
{{.Route}}
{{range .Routes}}{{if ne . $.Route}}{{.}}
{{end}}{{end}}`
		subject += fmt.Sprintf("[%s] %s Build %s %s.",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
			notification.Meta.BuildName,
			msg,
		)
	case "problemNotification":
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" && eventSplit[1] == "insert" {
			return "", "", "", "", "", fmt.Errorf("no matching event")
		}
		mainHTMLTpl = `[{{.ProjectName}}] New problem found for <code>{{.EnvironmentName}}</code>
		<ul><li>* Service: {{.ServiceName}}</li>{{ if ne .Severity "" }}
		<li>* Severity: {{.Severity}}{{end}}</li>{{ if ne .Description "" }}
		<li>* Description: {{.Description}}</li>{{end}}</ul>`
		plainTextTpl = `[{{.ProjectName}}] New problem found for ` + "`{{.EnvironmentName}}`" + `
* Service: ` + "`{{.ServiceName}}`" + `{{ if ne .Severity "" }}
* Severity: {{.Severity}}{{end}}{{ if ne .Description "" }}
* Description: {{.Description}}{{end}}`
		subject += fmt.Sprintf("[%s] New problem found for environment %s",
			notification.Meta.ProjectName,
			notification.Meta.EnvironmentName,
		)
	default:
		return "", "", "", "", "", fmt.Errorf("no matching event")
	}

	var body bytes.Buffer
	t, _ := template.New("email").Parse(mainHTMLTpl)
	err = t.Execute(&body, notification.Meta)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating html email template for event %s and project %s: %v", notification.Event, notification.Meta.ProjectName, err)
	}
	mainHTML += body.String()

	var plainTextBuffer bytes.Buffer
	t, _ = template.New("email").Parse(plainTextTpl)
	err = t.Execute(&plainTextBuffer, notification.Meta)
	if err != nil {
		return "", "", "", "", "", fmt.Errorf("error generating plaintext email template for event %s and project %s: %v", notification.Event, notification.Meta.ProjectName, err)
	}
	plainText += plainTextBuffer.String()
	if subject == "" {
		subject = plainText
	}
	return emoji, color, subject, mainHTML, plainText, nil
}

func (h *Messaging) prepareAndSendEmail(emoji, color, subject, event, project, emailAddress, mainHTML, plainText string) {
	var body bytes.Buffer

	// mimeHeaders := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	// body.Write([]byte(fmt.Sprintf("From: Lagoon Notifications<%s>\nSubject: %s \n%s\n\n", h.EmailSender, subject, mimeHeaders)))

	t, _ := template.New("email").Parse(htmlTemplate)
	t.Execute(&body, struct {
		Color       string
		Emoji       string
		Title       string
		ProjectName string
		MainHTML    string
	}{
		Title:       plainText,
		Color:       color,
		Emoji:       emoji,
		ProjectName: project,
		MainHTML:    mainHTML,
	})

	err := h.deliverEmail(emailAddress, subject, plainText, body)
	if err != nil {
		log.Printf("Error sending email for project %s: %v", project, err)
		return
	}

	log.Printf("Sent %s message to email for project %s", event, project)

}

func getEmailEvent(msgEvent string) (string, string, string, error) {
	if val, ok := emailEvent[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var emailEvent = map[string]EventMap{
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

	"task:deploy-openshift:finished":           {Emoji: successEmoji, Color: "lawngreen", Template: "deployFinished"},
	"task:remove-openshift-resources:finished": {Emoji: successEmoji, Color: "lawngreen", Template: "deployFinished"},
	"task:builddeploy-openshift:complete":      {Emoji: successEmoji, Color: "lawngreen", Template: "deployFinished"},
	"task:builddeploy-kubernetes:complete":     {Emoji: successEmoji, Color: "lawngreen", Template: "deployFinished"}, //not in teams

	"task:remove-openshift:finished":  {Emoji: successEmoji, Color: "lawngreen", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: successEmoji, Color: "lawngreen", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: "‼️", Color: "red", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: "‼️", Color: "red", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: "‼️", Color: "red", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: "‼️", Color: "red", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: warningEmoji, Color: "gold", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: warningEmoji, Color: "gold", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: warningEmoji, Color: "gold", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: warningEmoji, Color: "gold", Template: "notDeleted"},
}
