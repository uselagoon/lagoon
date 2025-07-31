package events

import (
	"log"

	"github.com/drone/go-scm/scm"
)

func HandlePush(event *scm.PushHook) {
	log.Println(
		"A2",
		event.Repo.Clone,
		event.Repo.CloneSSH,
		event.Ref,
		event.Commit.Sha,
		event.Commit.Message,
		event.Repo.Namespace,
		event.Repo.Name,
		event.Sender.Login,
	)
}
