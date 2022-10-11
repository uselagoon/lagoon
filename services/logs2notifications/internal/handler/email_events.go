package handler

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"log"
	"strconv"
	"strings"
	"text/template"

	gomail "gopkg.in/mail.v2"
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
	h.sendEmailMessage(emoji, color, subject, notification.Event, notification.Meta.ProjectName, emailAddress, mainHTML, plainText)
}

// SendToEmail .
func (h *Messaging) processEmailTemplates(notification *Notification) (string, string, string, string, string, error) {

	emoji, color, tpl, err := getEmailEvent(notification.Event)
	if err != nil {
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" {
			return "", "", "", "", "", nil
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
		mainHTMLTpl = `Deployment triggered <code>{{.BranchName}}</code>{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
		plainTextTpl = `[{{.ProjectName}}] Deployment triggered on branch {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}}`
	case "removeFinished":
		mainHTMLTpl = `Remove <code>{{.OpenshiftProject}}</code>`
		plainTextTpl = `[{{.ProjectName}}] remove {{.OpenshiftProject}}`
	case "notDeleted":
		mainHTMLTpl = `<code>{{.OpenshiftProject}}</code> not deleted.`
		plainTextTpl = `[{{.ProjectName}}] {{.OpenshiftProject}} not deleted. {{.Error}}`
	case "deployError":
		mainHTMLTpl = `[{{.ProjectName}}] <code>{{.BranchName}}</code>{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build <code>{{.BuildName}}</code> error.
{{if ne .LogLink ""}} <a href="{{.LogLink}}">Logs</a>{{end}}`
		plainTextTpl = `[{{.ProjectName}}] {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build {{.BuildName}} error.
{{if ne .LogLink ""}} [Logs]({{.LogLink}}){{end}}`
		subject += fmt.Sprintf("[%s] %s Build %s error.",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
			notification.Meta.BuildName,
		)
	case "deployFinished":
		mainHTMLTpl = `[{{.ProjectName}}] <code>{{.BranchName}}</code>{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build <code>{{.BuildName}}</code> complete. {{if ne .LogLink ""}}<a href="{{.LogLink}}">Logs</a>{{end}}
</p>
</div>
<div>
<p>
<ul>
<li><a href="{{.Route}}">{{.Route}}</a></li>
{{range .Routes}}{{if ne . $.Route}}<li><a href="{{.}}">{{.}}</a></li>
{{end}}{{end}}</ul>`
		plainTextTpl = `[{{.ProjectName}}] {{.BranchName}}{{ if ne .ShortSha "" }} ({{.ShortSha}}){{end}} Build {{.BuildName}} complete. {{if ne .LogLink ""}}[Logs]({{.LogLink}}){{end}}
{{.Route}}
{{range .Routes}}{{if ne . $.Route}}{{.}}
{{end}}{{end}}`
		subject += fmt.Sprintf("[%s] %s Build %s complete.",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
			notification.Meta.BuildName,
		)
	case "problemNotification":
		eventSplit := strings.Split(notification.Event, ":")
		if eventSplit[0] != "problem" && eventSplit[1] == "insert" {
			return "", "", "", "", "", nil
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
		return "", "", "", "", "", nil
	}

	var body bytes.Buffer
	t, _ := template.New("email").Parse(mainHTMLTpl)
	t.Execute(&body, notification.Meta)
	mainHTML += body.String()

	var plainTextBuffer bytes.Buffer
	t, _ = template.New("email").Parse(plainTextTpl)
	t.Execute(&plainTextBuffer, notification.Meta)
	plainText += plainTextBuffer.String()
	if subject == "" {
		subject = plainText
	}
	return emoji, color, subject, mainHTML, plainText, nil
}

func (h *Messaging) sendEmailMessage(emoji, color, subject, event, project, emailAddress, mainHTML, plainText string) {
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

	m := gomail.NewMessage()
	m.SetHeader("From", h.EmailSender)
	m.SetHeader("To", emailAddress)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", plainText)
	m.AddAlternative("text/html", body.String())
	sPort, _ := strconv.Atoi(h.EmailPort)
	if h.EmailSenderPassword != "" {
		d := gomail.NewDialer(h.EmailHost, sPort, h.EmailSender, h.EmailSenderPassword)
		d.TLSConfig = &tls.Config{InsecureSkipVerify: h.EmailInsecureSkipVerify}
		if err := d.DialAndSend(m); err != nil {
			log.Printf("Error sending email for project %s: %v", project, err)
			return
		}
	} else {
		d := gomail.Dialer{Host: h.EmailHost, Port: sPort, SSL: h.EmailSSL}
		d.TLSConfig = &tls.Config{InsecureSkipVerify: h.EmailInsecureSkipVerify}
		if err := d.DialAndSend(m); err != nil {
			log.Printf("Error sending email for project %s: %v", project, err)
			return
		}

	}
	log.Println(fmt.Sprintf("Sent %s message to email for project %s", event, project))
}

func getEmailEvent(msgEvent string) (string, string, string, error) {
	if val, ok := emailEvent[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var emailEvent = map[string]EventMap{
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

	"task:remove-openshift:error":        {Emoji: "‼️", Color: "red", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: "‼️", Color: "red", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: "‼️", Color: "red", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: "‼️", Color: "red", Template: "deployError"},

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
	// "task:deploy-openshift:error":           {Emoji: "‼️", Color: "red", Template: "deployError"},
	// "task:remove-openshift-resources:error": {Emoji: "‼️", Color: "red", Template: "deployError"},

	// deprecated
	// "task:deploy-openshift:retry":           {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
	// "task:remove-openshift:retry":           {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
	// "task:remove-kubernetes:retry":          {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
	// "task:remove-openshift-resources:retry": {Emoji: "⚠️", Color: "gold", Template: "removeRetry"},
}
