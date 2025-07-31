package events

import (
	"log"

	"github.com/drone/go-scm/scm"
)

func HandleBranch(event *scm.BranchHook) {
	log.Println(
		"B2",
		event.Repo.Clone,
		event.Repo.CloneSSH,
		event.Ref,
		event.Repo.Namespace,
		event.Repo.Name,
		event.Sender.Login,
	)
}
