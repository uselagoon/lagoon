package events

import (
	"log"

	"github.com/drone/go-scm/scm"
)

func (e *Events) HandlePull(gitType, event, uuid string, scmWebhook *scm.PullRequestHook) {
	log.Println(
		"pull", ":",
		gitType, ":",
		event, ":",
		uuid, ":",
		scmWebhook.Action, ":",
		scmWebhook.Repo.Clone, ":",
		scmWebhook.Repo.CloneSSH, ":",
		scmWebhook.PullRequest.Number, ":",
		scmWebhook.Repo.Namespace, ":",
		scmWebhook.Repo.Name, ":",
		scmWebhook.Sender.Login, ":",
	)

	if scmWebhook.Repo.CloneSSH != "" {
		projects, bulkId, bulkName := e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.CloneSSH)
		if len(projects) > 0 {
			log.Println(projects, bulkId, bulkName)
		}
	} else if scmWebhook.Repo.Clone != "" {
		projects, bulkId, bulkName := e.findProjectsByGitURL(gitType, event, uuid, scmWebhook.Repo.Clone)
		if len(projects) > 0 {
			log.Println(projects, bulkId, bulkName)
		}
	}
}
