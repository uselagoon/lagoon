package gitlab

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"

	"github.com/uselagoon/lagoon/services/webhooks/internal/lagoon"
	"github.com/uselagoon/lagoon/services/webhooks/internal/messaging"
	"github.com/uselagoon/machinery/api/schema"
	gitlab "gitlab.com/gitlab-org/api/client-go"
)

// GitlabAPI .
type GitlabAPI struct {
	GitlabAPIHost         string
	GitlabAPIToken        string
	GitlabSystemHookToken string
}

type SystemHook struct {
	client    *gitlab.Client
	LagoonAPI lagoon.LagoonAPI
	Messaging messaging.Messaging
}

func New(api, token string, lapi lagoon.LagoonAPI, m messaging.Messaging) (SystemHook, error) {
	git, err := gitlab.NewClient(token, gitlab.WithBaseURL(api))
	if err != nil {
		return SystemHook{}, fmt.Errorf("failed to create gitlab: %v", err)
	}
	return SystemHook{
		client:    git,
		LagoonAPI: lapi,
		Messaging: m,
	}, nil
}

func (sh *SystemHook) HandleSystemHook(body []byte) error {
	var p map[string]interface{}
	_ = json.Unmarshal(body, &p)
	switch p["event_name"].(string) {
	case "group_create":
		sh.gitlabGroupCreate(body)
	case "group_rename", "PLACEHOLDER_group_update":
		sh.gitlabGroupUpdate(body)
	case "group_destroy":
		sh.gitlabGroupDelete(body)
	case "project_create":
		sh.gitlabProjectCreate(body)
	case "project_transfer", "project_rename", "project_update":
		sh.gitlabProjectUpdate(body)
	case "project_destroy":
		sh.gitlabProjectDelete(body)
	case "user_create":
		sh.gitlabUserCreate(body)
	case "user_rename", "PLACEHOLDER_user_update":
		sh.gitlabUserUpdate(body)
	case "user_destroy":
		sh.gitlabUserDelete(body)
	case "user_add_to_group":
		sh.gitlabUserGroupAdd(body)
	case "user_remove_from_group":
		sh.gitlabUserGroupRemove(body)
	case "user_add_to_team":
		sh.gitlabUserProjectAdd(body)
	case "user_remove_from_team":
		sh.gitlabUserProjectRemove(body)
	case "key_create":
		sh.gitlabSshKeyAdd(body)
	case "key_destroy":
		sh.gitlabSshKeyRemove(body)
	default:
		// unhandled(webhook, `${webhooktype}:${event}`);
	}
	return nil
}

func (sh *SystemHook) handleError(errMsg string, err error) {
	sh.Messaging.SendToLagoonLogs(
		"error",
		"",
		"",
		"gitlab:key_destroy:handled",
		fmt.Sprintf("%s %s", errMsg, err.Error()),
		schema.LagoonLogMeta{},
	)
}

func sanitizeGroupName(in string) string {
	return regexp.MustCompile(`[^a-zA-Z0-9-]`).ReplaceAllString(
		strings.ToLower(in),
		"$1-$2",
	)
}
