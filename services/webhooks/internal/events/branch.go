package events

import (
	"log"
	"strings"

	"github.com/drone/go-scm/scm"
)

func (e *Events) HandleBranch(gitType, event, uuid string, scmWebhook *scm.BranchHook) {
	log.Println(
		"branch", ":",
		gitType, ":",
		event, ":",
		uuid, ":",
		scmWebhook.Action, ":",
		scmWebhook.Repo.Clone, ":",
		scmWebhook.Repo.CloneSSH, ":",
		strings.ToLower(strings.ReplaceAll(scmWebhook.Ref.Name, "refs/heads/", "")), ":",
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
