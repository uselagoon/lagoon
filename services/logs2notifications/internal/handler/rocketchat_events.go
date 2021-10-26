package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
func SendToRocketChat(notification *Notification, channel, webhook, appID string) {

	emoji, color, template, err := getRocketChatEvent(notification.Event)

	var text string
	switch template {
	case "mergeRequestOpened":
		text = fmt.Sprintf("*[%s]* PR [#%s (%s)](%s) opened in [%s](%s)",
			notification.Meta.ProjectName,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoName,
			notification.Meta.RepoURL,
		)
	case "mergeRequestUpdated":
		text = fmt.Sprintf("*[%s]* PR [#%s (%s)](%s) updated in [%s](%s)",
			notification.Meta.ProjectName,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoName,
			notification.Meta.RepoURL,
		)
	case "mergeRequestClosed":
		text = fmt.Sprintf("*[%s]* PR [#%s (%s)](%s) closed in [%s](%s)",
			notification.Meta.ProjectName,
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoName,
			notification.Meta.RepoURL,
		)
	case "deleteEnvironment":
		text = fmt.Sprintf("*[%s]* delete trigger `%s`",
			notification.Meta.ProjectName,
			notification.Meta.EnvironmentName,
		)
	case "repoPushHandled":
		text = fmt.Sprintf("*[%s]* [%s](%s/tree/%s)",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
			notification.Meta.RepoURL,
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			text = fmt.Sprintf("%s ([%s](%s))",
				text,
				notification.Meta.ShortSha,
				notification.Meta.CommitURL,
			)
		}
		text = fmt.Sprintf("%s pushed in [%s](%s)",
			text,
			notification.Meta.RepoFullName,
			notification.Meta.RepoURL,
		)
	case "repoPushSkipped":
		text = fmt.Sprintf("*[%s]* [%s](%s/tree/%s)",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
			notification.Meta.RepoURL,
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			text = fmt.Sprintf("%s ([%s](%s))",
				text,
				notification.Meta.ShortSha,
				notification.Meta.CommitURL,
			)
		}
		text = fmt.Sprintf("%s pushed in [%s](%s) *deployment skipped*",
			text,
			notification.Meta.RepoFullName,
			notification.Meta.RepoURL,
		)
	case "deployEnvironment":
		text = fmt.Sprintf("*[%s]* API deploy trigger `%s`",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			text = fmt.Sprintf("%s (%s)",
				text,
				notification.Meta.ShortSha,
			)
		}
	default:
		text = fmt.Sprintf("*[%s]* Event received for `%s`",
			notification.Meta.ProjectName,
			notification.Meta.BranchName,
		)
	}

	data := RocketChatData{
		Channel: channel,
		Attachments: []RocketChatAttachment{{
			Text:  fmt.Sprintf("%s %s", emoji, text),
			Color: color,
			Fields: []RocketChatAttachmentField{{
				Short: true,
				Title: "Source",
				Value: appID,
			}},
		}},
	}

	jsonBytes, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", webhook, bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Content-Length", fmt.Sprintf("%d", len(jsonBytes)))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	log.Println(fmt.Sprintf("Sent %s message to rocketchat", notification.Event))
}

func getRocketChatEvent(msgEvent string) (string, string, string, error) {
	if val, ok := rocketChatEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

type rocketChatEvent struct {
	Emoji    string `json:"emoji"`
	Color    string `json:"color"`
	Template string `json:"template"`
}

var rocketChatEventTypeMap = map[string]rocketChatEvent{
	"github:pull_request:opened:handled":           {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"gitlab:merge_request:opened:handled":          {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:opened:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"},
	"bitbucket:pullrequest:created:handled":        {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestOpened"},

	"github:pull_request:synchronize:handled":      {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"gitlab:merge_request:updated:handled":         {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"bitbucket:pullrequest:updated:opened:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"},
	"bitbucket:pullrequest:updated:handled":        {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestUpdated"},

	"github:pull_request:closed:handled":      {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:fulfilled:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"bitbucket:pullrequest:rejected:handled":  {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},
	"gitlab:merge_request:closed:handled":     {Emoji: ":information_source:", Color: "#E8E8E8", Template: "mergeRequestClosed"},

	"github:delete:handled":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"},
	"gitlab:remove:handled":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"},
	"bitbucket:delete:handled": {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"},
	"api:deleteEnvironment":    {Emoji: ":information_source:", Color: "#E8E8E8", Template: "deleteEnvironment"},

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
	"task:builddeploy-kubernetes:complete":     {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "deployFinished"},

	"task:remove-openshift:finished":  {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: ":white_check_mark:", Color: "lawngreen", Template: "removeFinished"},

	"task:deploy-openshift:retry":           {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
	"task:remove-openshift:retry":           {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
	"task:remove-kubernetes:retry":          {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},
	"task:remove-openshift-resources:retry": {Emoji: ":warning:", Color: "gold", Template: "removeRetry"},

	"task:deploy-openshift:error":           {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:builddeploy-openshift:failed":     {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:builddeploy-kubernetes:failed":    {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:remove-openshift:error":           {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:remove-kubernetes:error":          {Emoji: ":bangbang:", Color: "red", Template: "deployError"},
	"task:remove-openshift-resources:error": {Emoji: ":bangbang:", Color: "red", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},
	"rest:remove:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "gold", Template: "notDeleted"},

	// "rest:deploy:receive":  {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:remove:receive":  {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:promote:receive": {Emoji: ":information_source:", Color: "#E8E8E8"},
}
