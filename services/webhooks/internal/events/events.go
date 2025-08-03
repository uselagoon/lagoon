package events

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/uselagoon/lagoon/services/webhooks/internal/lagoon"
	"github.com/uselagoon/lagoon/services/webhooks/internal/messaging"
	"github.com/uselagoon/machinery/api/schema"
)

type Events struct {
	LagoonAPI lagoon.LagoonAPI
	Messaging *messaging.Messenger
}

func New(lapi lagoon.LagoonAPI, m *messaging.Messenger) Events {
	return Events{
		LagoonAPI: lapi,
		Messaging: m,
	}
}

func (e *Events) findProjectsByGitURL(gitType, event, uuid, gitURL string) ([]schema.Project, string, string) {
	lc, err := lagoon.GetClient(e.LagoonAPI)
	if err != nil {
		log.Printf("LAGOON ERROR: %v", err)
		return nil, "", ""
	}
	query := fmt.Sprintf(`query webhookProcessProjects {
        allProjects(gitUrl: "%s") {
        	name
        	deploymentsDisabled
        }
    }`, gitURL)
	result, err := lc.ProcessRaw(context.Background(), query, nil)
	if err != nil {
		log.Printf("LAGOON ERROR: %v", err)
		return nil, "", ""
	}
	projects := result.([]schema.Project)
	resultProject := []schema.Project{}
	for _, project := range projects {
		one := uint(1)
		if project.DeploymentsDisabled != &one {
			resultProject = append(resultProject, project)
		}
	}

	log.Println(resultProject)
	if len(resultProject) > 1 {
		return resultProject, uuid, fmt.Sprintf("Polysite - %s:%s - %s", gitType, event, time.Now().UTC().Format("2006-01-02 15:04:05"))
	}
	return resultProject, "", ""
}
