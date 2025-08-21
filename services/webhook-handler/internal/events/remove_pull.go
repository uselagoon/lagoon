package events

import (
	"fmt"
	"log"

	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) removePull(project schema.Project, environment schema.Environment, sourceUser string) ([]byte, error) {
	removeData := lagoon.RemoveData{
		ProjectName:          project.Name,
		OpenshiftProjectName: environment.OpenshiftProjectName,
		BranchName:           environment.Name,
		Type:                 "pullrequest",
	}
	log.Println("remove environment from project", environment.Name, project.Name, environment.DeployTarget.Name, removeData)
	e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:remove", environment.DeployTarget.Name), lagoon.RemoveToBytes(&removeData))
	return nil, nil
}
