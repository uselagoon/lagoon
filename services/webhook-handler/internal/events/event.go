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
	Project  string
	Response []byte
	Error    error
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
