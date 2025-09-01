package events

import (
	"fmt"
	"log"

	// we can't use go regex as some things people do with the regex in nodejs aren't supported in golang re2 regex

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) deployPromote(project schema.Project, deployData lagoon.DeployData) ([]byte, error) {
	// get deploytargets for environment if the environment already exists
	var deployTarget *schema.DeployTarget
	foundEnvironment := false
	for _, env := range project.Environments {
		if env.Name == deployData.PromoteSourceEnvironment {
			foundEnvironment = true
			deployTarget = &env.DeployTarget
		}
	}

	if !foundEnvironment {
		return nil, fmt.Errorf("no existing environment to promote from that contains a valid deploytarget")
	}

	if deployTarget != nil {
		deployData.DeployTarget = *deployTarget
		buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
		if err != nil {
			e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
			return nil, err
		}
		log.Printf("promote environment %s for project %s to environment %s on deploytarget %s", deployData.PromoteSourceEnvironment, buildData.Spec.Project.Name, buildData.Spec.Project.Environment, deployTarget.Name)
		e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
		return []byte(buildData.Name), nil
	}
	return nil, fmt.Errorf("")
}
