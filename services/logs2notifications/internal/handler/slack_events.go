package handler

import (
	"fmt"
	"log"

	"github.com/slack-go/slack"
)

// SendToSlack .
func SendToSlack(notification *Notification, channel, webhook, appID string) {

	emoji, color, _, err := getSlackEvent(notification.Event)
	if err != nil {
		return
	}
	attachment := slack.Attachment{
		Text:       fmt.Sprintf("%s %s", emoji, notification.Message),
		Color:      color,
		Footer:     appID,
		MarkdownIn: []string{"pretext", "text", "fields"},
	}
	postMsg := slack.WebhookMessage{
		Attachments: []slack.Attachment{attachment},
		Channel:     channel,
	}

	err = slack.PostWebhook(webhook, &postMsg)
	if err != nil {
		// just log any errors
		log.Printf("Error sending message to slack: %v", err)
		return
	}
	log.Println(fmt.Sprintf("Sent %s message to slack", notification.Event))
}

func getSlackEvent(msgEvent string) (string, string, string, error) {
	if val, ok := slackEventTypeMap[msgEvent]; ok {
		return val.Emoji, val.Color, val.Template, nil
	}
	return "", "", "", fmt.Errorf("no matching event source")
}

var slackEventTypeMap = map[string]EventMap{
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

	"task:deploy-openshift:finished":           {Emoji: ":white_check_mark:", Color: "good", Template: "deployFinished"},
	"task:remove-openshift-resources:finished": {Emoji: ":white_check_mark:", Color: "good", Template: "deployFinished"},
	"task:builddeploy-openshift:complete":      {Emoji: ":white_check_mark:", Color: "good", Template: "deployFinished"},
	"task:builddeploy-kubernetes:complete":     {Emoji: ":white_check_mark:", Color: "good", Template: "deployFinished"}, //not in teams

	"task:remove-openshift:finished":  {Emoji: ":white_check_mark:", Color: "good", Template: "removeFinished"},
	"task:remove-kubernetes:finished": {Emoji: ":white_check_mark:", Color: "good", Template: "removeFinished"},

	"task:remove-openshift:error":        {Emoji: ":bangbang:", Color: "danger", Template: "deployError"},
	"task:remove-kubernetes:error":       {Emoji: ":bangbang:", Color: "danger", Template: "deployError"},
	"task:builddeploy-kubernetes:failed": {Emoji: ":bangbang:", Color: "danger", Template: "deployError"}, //not in teams
	"task:builddeploy-openshift:failed":  {Emoji: ":bangbang:", Color: "danger", Template: "deployError"},

	"github:pull_request:closed:CannotDeleteProductionEnvironment": {Emoji: ":warning:", Color: "warning", Template: "notDeleted"},
	"github:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "warning", Template: "notDeleted"},
	"bitbucket:repo:push:CannotDeleteProductionEnvironment":        {Emoji: ":warning:", Color: "warning", Template: "notDeleted"},
	"gitlab:push:CannotDeleteProductionEnvironment":                {Emoji: ":warning:", Color: "warning", Template: "notDeleted"},

	// deprecated
	// "rest:remove:CannotDeleteProductionEnvironment": {Emoji: ":warning:", Color: "warning"},
	// "rest:deploy:receive":                           {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:remove:receive":                           {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:promote:receive":                          {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:pullrequest:deploy":                       {Emoji: ":information_source:", Color: "#E8E8E8"},
	// "rest:pullrequest:remove":                       {Emoji: ":information_source:", Color: "#E8E8E8"},

	// deprecated
	// "task:deploy-openshift:error":           {Emoji: ":bangbang:", Color: "danger", Template: "deployError"},
	// "task:remove-openshift-resources:error": {Emoji: ":bangbang:", Color: "danger", Template: "deployError"},

	// deprecated
	// "task:deploy-openshift:retry":           {Emoji: ":warning:", Color: "warning", Template: "removeRetry"},
	// "task:remove-openshift:retry":           {Emoji: ":warning:", Color: "warning", Template: "removeRetry"},
	// "task:remove-kubernetes:retry":          {Emoji: ":warning:", Color: "warning", Template: "removeRetry"},
	// "task:remove-openshift-resources:retry": {Emoji: ":warning:", Color: "warning", Template: "removeRetry"},
}
