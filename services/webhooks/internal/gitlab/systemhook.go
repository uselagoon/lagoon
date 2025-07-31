package gitlab

import (
	"encoding/json"
	"fmt"
	"log"
	"slices"

	gitlab "gitlab.com/gitlab-org/api/client-go"
)

func HandleSystemHook(api, token string, body []byte) error {
	var p map[string]interface{}
	_ = json.Unmarshal(body, &p)
	if slices.Contains(secureGitlabSystemHooks, p["event_name"].(string)) {
		log.Println(string(body))
		git, err := gitlab.NewClient(token, gitlab.WithBaseURL(api))
		if err != nil {
			return fmt.Errorf("failed to create gitlab: %v", err)
		}
		log.Println(git)
		switch p["event_name"].(string) {
		case "gitlab:group_create":
		//   await handle(gitlabGroupCreate, webhook, `${webhooktype}:${event}`);
		case "gitlab:group_rename", "gitlab:PLACEHOLDER_group_update":
		//   await handle(gitlabGroupUpdate, webhook, `${webhooktype}:${event}`);
		case "gitlab:group_destroy":
		//   await handle(gitlabGroupDelete, webhook, `${webhooktype}:${event}`);
		case "gitlab:project_create":
		//   await handle(gitlabProjectCreate, webhook, `${webhooktype}:${event}`);
		case "gitlab:project_transfer", "gitlab:project_rename", "gitlab:project_update":
		//   await handle(gitlabProjectUpdate, webhook, `${webhooktype}:${event}`);
		case "gitlab:project_destroy":
		//   await handle(gitlabProjectDelete, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_create":
		//   await handle(gitlabUserCreate, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_rename", "gitlab:PLACEHOLDER_user_update":
		//   await handle(gitlabUserUpdate, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_destroy":
		//   await handle(gitlabUserDelete, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_add_to_group":
		//   await handle(gitlabUserGroupAdd, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_remove_from_group":
		//   await handle(gitlabUserGroupRemove, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_add_to_team":
		//   await handle(gitlabUserProjectAdd, webhook, `${webhooktype}:${event}`);
		case "gitlab:user_remove_from_team":
		//   await handle(gitlabUserProjectRemove, webhook, `${webhooktype}:${event}`);
		case "gitlab:key_create":
		//   await handle(gitlabSshKeyAdd, webhook, `${webhooktype}:${event}`);
		case "gitlab:key_destroy":
		//   await handle(gitlabSshKeyRemove, webhook, `${webhooktype}:${event}`);
		default:
			// unhandled(webhook, `${webhooktype}:${event}`);
		}
	}
	return nil
}

var secureGitlabSystemHooks = []string{
	"group_create",
	"group_rename",
	"group_destroy",
	"project_create",
	"project_transfer",
	"project_rename",
	"project_update",
	"project_destroy",
	"user_create",
	"user_rename",
	"user_destroy",
	"user_add_to_group",
	"user_remove_from_group",
	"user_add_to_team",
	"user_remove_from_team",
	"key_create",
	"key_destroy",
}
