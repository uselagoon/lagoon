package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
func SendToMicrosoftTeams(notification *Notification, webhook, appID string) {

	emoji, color, template, err := getMicrosoftTeamsEvent(notification.Event)
	if err != nil {
		return
	}

	var text string
	switch template {
	case "mergeRequestOpened":
		text = fmt.Sprintf("PR [#%s (%s)](%s) opened in [%s](%s)",
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoName,
			notification.Meta.RepoURL,
		)
	case "mergeRequestUpdated":
		text = fmt.Sprintf("PR [#%s (%s)](%s) updated in [%s](%s)",
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoName,
			notification.Meta.RepoURL,
		)
	case "mergeRequestClosed":
		text = fmt.Sprintf("PR [#%s (%s)](%s) closed in [%s](%s)",
			notification.Meta.PullrequestNumber,
			notification.Meta.PullrequestTitle,
			notification.Meta.PullrequestURL,
			notification.Meta.RepoName,
			notification.Meta.RepoURL,
		)
	case "deleteEnvironment":
		text = fmt.Sprintf("Deleting environment `%s`",
			notification.Meta.EnvironmentName,
		)
	case "repoPushHandled":
		text = fmt.Sprintf("[%s](%s/tree/%s)",
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
		text = fmt.Sprintf("[%s](%s/tree/%s)",
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
		text = fmt.Sprintf("Deployment triggered `%s`",
			notification.Meta.BranchName,
		)
		if notification.Meta.ShortSha != "" {
			text = fmt.Sprintf("%s (%s)",
				text,
				notification.Meta.ShortSha,
			)
		}
	case "removeFinished":
		text = fmt.Sprintf("Removed `%s`",
			notification.Meta.OpenshiftProject,
		)
	case "removeRetry":
		text = fmt.Sprintf("Removed `%s`",
			notification.Meta.OpenshiftProject,
		)
	case "notDeleted":
		text = fmt.Sprintf("`%s` not deleted. %s",
			notification.Meta.BranchName,
			notification.Meta.Error,
		)
	case "deployError":
		if notification.Meta.ShortSha != "" {
			text += fmt.Sprintf("`%s` %s",
				notification.Meta.BranchName,
				notification.Meta.ShortSha,
			)
		} else {
			text += fmt.Sprintf(" `%s`",
				notification.Meta.BranchName,
			)
		}
		text += fmt.Sprintf(" Build `%s` Failed.",
			notification.Meta.BuildName,
		)
		if notification.Meta.LogLink != "" {
			text += fmt.Sprintf(" [Logs](%s) \r",
				notification.Meta.LogLink,
			)
		}
	case "deployFinished":
		if notification.Meta.ShortSha != "" {
			text += fmt.Sprintf("`%s` %s",
				notification.Meta.BranchName,
				notification.Meta.ShortSha,
			)
		} else {
			text += fmt.Sprintf("`%s`",
				notification.Meta.BranchName,
			)
		}
		text += fmt.Sprintf(" Build `%s` Succeeded.",
			notification.Meta.BuildName,
		)
		if notification.Meta.LogLink != "" {
			text += fmt.Sprintf(" [Logs](%s) \r",
				notification.Meta.LogLink,
			)
		}
		text += fmt.Sprintf("* %s \n",
			notification.Meta.Route,
		)
		if len(notification.Meta.Routes) != 0 {
			for _, r := range notification.Meta.Routes {
				if r != notification.Meta.Route {
					text += fmt.Sprintf("* %s \n", r)
				}
			}
		}
	default:
		// do nothing
		return
	}

	data := MicrosoftTeamsData{
		Type:       "MessageCard",
		Context:    "http://schema.org/extensions",
		Summary:    text,
		Title:      notification.Meta.ProjectName,
		ThemeColor: color,
		Sections: []MicrosoftTeamsSection{
			{
				ActivityText:  text,
				ActivityImage: emoji,
			},
		},
	}

	jsonBytes, _ := json.Marshal(data)
	req, err := http.NewRequest("POST", webhook, bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Error sending message to rocketchat: %v", err)
		return
	}
	defer resp.Body.Close()
	log.Println(fmt.Sprintf("Sent %s message to rocketchat", notification.Event))
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
