package events

import (
	"fmt"
	"regexp"
	"time"

	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/lagoon/services/webhook-handler/internal/messaging"
	"github.com/uselagoon/machinery/api/schema"
)

type Events struct {
	LagoonAPI lagoon.LagoonAPI
	Messaging messaging.Messaging
}

func New(lapi lagoon.LagoonAPI, m messaging.Messaging) Events {
	return Events{
		LagoonAPI: lapi,
		Messaging: m,
	}
}

type Response struct {
	Project  string `json:"project,omitempty"`
	Response string `json:"response,omitempty"`
	Error    error  `json:"error,omitempty"`
}

func (e *Events) findProjectsByGitURL(gitType, event, uuid, gitURL string) ([]schema.Project, string, string, error) {
	projects, err := e.LagoonAPI.AllProjectByGitURL(gitURL)
	if err != nil {
		return nil, "", "", err
	}
	resultProjects := []schema.Project{}
	for _, project := range *projects {
		one := uint(1)
		if project.DeploymentsDisabled == nil || project.DeploymentsDisabled != &one {
			resultProjects = append(resultProjects, project)
		}
	}

	if len(resultProjects) > 1 {
		return resultProjects, uuid, fmt.Sprintf("Polysite - %s:%s - %s", gitType, event, time.Now().UTC().Format("2006-01-02 15:04:05")), nil
	}
	return resultProjects, "", "", nil
}

func skipDeploy(message string) bool {
	// case-insensitive regex match for "[skip deploy]" or "[deploy skip]"
	re := regexp.MustCompile(`(?i)\[skip deploy\]|\[deploy skip\]`)
	return re.MatchString(message)
}

// Bitbucket does not provide a git-ssh URI to the repo in the webhook payload
// We the html repo link (example https://bitbucket.org/teamawesome/repository) to extract the correct target domain (bitbucket.org)
// this could be bitbuck.org(.com) or a private bitbucket server
// Also the git server could be running on another port than 22, so there is a second regex match for `:[0-9]`
func BitBucketGitURL(repositoryURL, fullName string) string {
	// https://github.com/uselagoon/lagoon/blob/v2.27.0/services/webhook-handler/src/extractWebhookData.ts#L68-L78
	re := regexp.MustCompile(`https?:\/\/([a-z0-9-_.]*)(:[0-9]*)?\/`)
	matches := re.FindStringSubmatch(repositoryURL)
	if len(matches) == 0 {
		return ""
	}
	domain := matches[1]
	port := matches[2]
	var gitURL string
	if port == "" {
		gitURL = fmt.Sprintf("git@%s:%s.git", domain, fullName)
	} else {
		gitURL = fmt.Sprintf("ssh://git@%s%s/%s.git", domain, port, fullName)
	}
	return gitURL
}
