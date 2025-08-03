package events

import (
	"log"
	"strings"

	"github.com/drone/go-scm/scm"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) HandlePush(gitType, event, uuid string, scmWebhook *scm.PushHook) {
	log.Println(
		"push", ":",
		gitType, ":",
		event, ":",
		uuid, ":",
		scmWebhook.Repo.Clone, ":",
		scmWebhook.Repo.CloneSSH, ":",
		strings.ToLower(strings.ReplaceAll(scmWebhook.Ref, "refs/heads/", "")), ":",
		scmWebhook.After, ":",
		scmWebhook.Commit.Sha, ":",
		scmWebhook.Commit.Message, ":",
		scmWebhook.Repo.Namespace, ":",
		scmWebhook.Repo.Name, ":",
		scmWebhook.Sender.Login,
	)

	var projects []schema.Project
	var bulkID, bulkName string
	if scmWebhook.Repo.CloneSSH != "" {
		projects, bulkID, bulkName = e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.CloneSSH)
		if len(projects) > 0 {
			log.Println(projects, bulkID, bulkName)
		}
	}
	if scmWebhook.Repo.Clone != "" {
		projects, bulkID, bulkName = e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.Clone)
		if len(projects) > 0 {
			log.Println(projects, bulkID, bulkName)
		}
	}
}
