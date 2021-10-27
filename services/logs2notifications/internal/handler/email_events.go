package handler

import (
	"bytes"
	"fmt"
	"log"
	"net/smtp"
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
  <div>
	<p>
        {{.Additional}}
	</p>
  </div>
</body>
</html>`

// SendToEmail .
func SendToEmail(notification *Notification, emailAddress, appID string) {

	emoji, color, tpl, err := getEmailEvent(notification.Event)
	if err != nil {
		return
	}
	var mainHTML, plainText, subject, additional string
	switch tpl {
	case "mergeRequestOpened":
		mainHTML += fmt.Sprintf(`PR <a href="%s">#%s (%s</a> opened in <a href="%s">%s</a>`,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoURL,
			notification.Meta.RepoName,
		)
		plainText += fmt.Sprintf(`[%s] PR #%s - %s opened in %s`,
			notification.Meta.ProjectName,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.RepoName,
		)
		subject += plainText
	case "mergeRequestUpdated":
		mainHTML += fmt.Sprintf(`PR <a href="%s">#%s (%s</a> updated in <a href="%s">%s</a>`,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoURL,
			notification.Meta.RepoName,
		)
		plainText += fmt.Sprintf(`[%s] PR #%s - %s updated in %s`,
			notification.Meta.ProjectName,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.RepoName,
		)
		subject += plainText
	case "mergeRequestClosed":
		mainHTML += fmt.Sprintf(`PR <a href="%s">#%s (%s</a> closed in <a href="%s">%s</a>`,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoURL,
			notification.Meta.RepoName,
		)
		plainText += fmt.Sprintf(`[%s] PR #%s - %s closed in %s`,
			notification.Meta.ProjectName,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.RepoName,
		)
		subject += plainText
	case "deleteEnvironment":
		mainHTML += fmt.Sprintf("Deleted environment <code>%s</code>",
			notification.Meta.BranchName,
		)
		plainText += fmt.Sprintf("[%s] deleted environment %s",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
		)
		subject += plainText
	case "repoPushHandled":
		mainHTML += fmt.Sprintf(`<a href="%s/tree/%s">%s</a>`,
			notification.Meta.RepoURL,
			notification.Meta.BranchName,
			notification.Meta.BranchName,
		)
		plainText += fmt.Sprintf(`[%s] %s`,
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			mainHTML += fmt.Sprintf(`%s <a href="%s">%s</a>`,
				mainHTML,
				notification.Meta.CommitURL,
				notification.Meta.ShortSha,
			)
			plainText += fmt.Sprintf(`%s (%s)`,
				plainText,
				notification.Meta.ShortSha,
			)
		}
		mainHTML += fmt.Sprintf(`%s pushed in <a href="%s">%s</a>`,
			mainHTML,
			notification.Meta.RepoURL,
			notification.Meta.RepoFullName,
		)
		plainText += fmt.Sprintf(`%s pushed in %s`,
			plainText,
			notification.Meta.RepoFullName,
		)
		subject += plainText
	case "repoPushSkipped":
		mainHTML += fmt.Sprintf(`<a href="%s/tree/%s">%s</a>`,
			notification.Meta.RepoURL,
			notification.Meta.BranchName,
			notification.Meta.BranchName,
		)
		plainText += fmt.Sprintf(`[%s] %s`,
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			mainHTML += fmt.Sprintf(`%s <a href="%s">%s</a>`,
				mainHTML,
				notification.Meta.CommitURL,
				notification.Meta.ShortSha,
			)
			plainText += fmt.Sprintf(`%s (%s)`,
				plainText,
				notification.Meta.ShortSha,
			)
		}
		mainHTML += fmt.Sprintf(`%s pushed in <a href="%s">%s</a> <strong>deployment skipped</strong>`,
			mainHTML,
			notification.Meta.RepoURL,
			notification.Meta.RepoFullName,
		)
		plainText += fmt.Sprintf(`%s pushed in %s *deployment skipped*`,
			plainText,
			notification.Meta.RepoFullName,
		)
		subject += plainText
	case "deployEnvironment":
		mainHTML += fmt.Sprintf("Deployment triggered <code>%s</code>",
			notification.Meta.BranchName,
		)
		plainText += fmt.Sprintf("[%s] Deployment triggered on branch %s",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			mainHTML += fmt.Sprintf(`%s (%s)`,
				mainHTML,
				notification.Meta.ShortSha,
			)
			plainText += fmt.Sprintf(`%s (%s)`,
				plainText,
				notification.Meta.ShortSha,
			)
		}
		subject += plainText
	case "removeFinished":
		mainHTML += fmt.Sprintf("Remove <code>%s</code>", notification.Meta.OpenshiftProject)
		plainText += fmt.Sprintf("[%s] remove %s", notification.Meta.ProjectName, notification.Meta.OpenshiftProject)
		subject += plainText
	case "notDeleted":
		mainHTML += fmt.Sprintf("<code>%s</code> not deleted.",
			notification.Meta.OpenshiftProject,
		)
		plainText += fmt.Sprintf("[%s] %s not deleted.",
			notification.Meta.ProjectName,
			notification.Meta.OpenshiftProject,
		)
		subject += plainText
		plainText += fmt.Sprintf("%s", notification.Meta.Error)
	case "deployError":
		mainHTML += fmt.Sprintf("[%s]",
			notification.Meta.ProjectName,
		)
		plainText += fmt.Sprintf("[%s]",
			notification.Meta.ProjectName,
		)
		if notification.Meta.ShortSha != "" {
			mainHTML += fmt.Sprintf(` <code>%s</code> (%s)`,
				notification.Meta.BranchName,
				notification.Meta.ShortSha,
			)
			plainText += fmt.Sprintf(` %s (%s)`,
				notification.Meta.BranchName,
				notification.Meta.ShortSha,
			)
		} else {
			mainHTML += fmt.Sprintf(` <code>%s</code>`,
				notification.Meta.BranchName,
			)
			plainText += fmt.Sprintf(` %s`,
				notification.Meta.BranchName,
			)
		}
		mainHTML += fmt.Sprintf(` Build <code>%s</code> error.`,
			notification.Meta.BuildName,
		)
		plainText += fmt.Sprintf(` Build %s error.`,
			notification.Meta.BuildName,
		)
		subject += plainText
		if notification.Meta.LogLink != "" {
			mainHTML += fmt.Sprintf(` <a href="%s">Logs</a>`,
				notification.Meta.LogLink,
			)
			plainText += fmt.Sprintf(` [Logs](%s)`,
				notification.Meta.LogLink,
			)
		}
	case "deployFinished":
		mainHTML += fmt.Sprintf("[%s]",
			notification.Meta.ProjectName,
		)
		plainText += fmt.Sprintf("[%s]",
			notification.Meta.ProjectName,
		)
		if notification.Meta.ShortSha != "" {
			mainHTML += fmt.Sprintf(` <code>%s</code> (%s)`,
				notification.Meta.BranchName,
				notification.Meta.ShortSha,
			)
			plainText += fmt.Sprintf(` %s (%s)`,
				notification.Meta.BranchName,
				notification.Meta.ShortSha,
			)
		} else {
			mainHTML += fmt.Sprintf(` <code>%s</code>`,
				notification.Meta.BranchName,
			)
			plainText += fmt.Sprintf(` %s`,
				notification.Meta.BranchName,
			)
		}
		mainHTML += fmt.Sprintf(` Build <code>%s</code> complete.`,
			notification.Meta.BuildName,
		)
		plainText += fmt.Sprintf(` Build %s complete.`,
			notification.Meta.BuildName,
		)
		subject += plainText
		if notification.Meta.LogLink != "" {
			mainHTML += fmt.Sprintf(` <a href="%s">Logs</a>`,
				notification.Meta.LogLink,
			)
			plainText += fmt.Sprintf(` [Logs](%s)`,
				notification.Meta.LogLink,
			)
		}
		additional += fmt.Sprintf(` <ul><li><a href="%s">%s</a></li>`,
			notification.Meta.Route,
			notification.Meta.Route,
		)
		plainText += fmt.Sprintf("%s %s\n",
			plainText,
			notification.Meta.Route,
		)
		if len(notification.Meta.Routes) != 0 {
			for _, r := range notification.Meta.Routes {
				if r != notification.Meta.Route {
					additional += fmt.Sprintf(` <li><a href="%s">%s</a></li>`,
						r,
						r,
					)
					plainText += fmt.Sprintf(" %s\n",
						r,
					)
				}
			}
		}
		mainHTML += fmt.Sprintf(` </ul>`)
	}

	t, _ := template.New("email").Parse(htmlTemplate)
	var body bytes.Buffer

	mimeHeaders := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	body.Write([]byte(fmt.Sprintf("From: Lagoon Notifications\nSubject: %s \n%s\n\n", subject, mimeHeaders)))

	t.Execute(&body, struct {
		Color       string
		Emoji       string
		Title       string
		ProjectName string
		MainHTML    string
		Additional  string
	}{
		Title:       plainText,
		Color:       color,
		Emoji:       emoji,
		ProjectName: notification.Meta.ProjectName,
		MainHTML:    mainHTML,
		Additional:  additional,
	})
	// Configuration
	from := "notifications@lagoon.sh"
	password := ""
	to := []string{emailAddress}
	smtpHost := "localhost"
	smtpPort := "1025"

	// Create authentication
	auth := smtp.PlainAuth("", from, password, smtpHost)
	// Send actual message
	err = smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, body.Bytes())
	if err != nil {
		log.Printf("Error sending message to email: %v", err)
		return
	}
	log.Println(fmt.Sprintf("Sent %s message to email", notification.Event))
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
