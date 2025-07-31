package events

import (
	"log"

	"github.com/drone/go-scm/scm"
)

func HandlePull(event *scm.PullRequestHook) {
	log.Println(
		"C2",
		event.Repo.Clone,
		event.Repo.CloneSSH,
		event.PullRequest.Number,
		event.Repo.Namespace,
		event.Repo.Name,
		event.Sender.Login,
	)
}
