package events

import (
	"fmt"
	"log"
	"regexp"

	"github.com/uselagoon/lagoon/services/webhook-handler/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) deployPull(project schema.Project, deployData lagoon.DeployData, bulkID, bulkName string) ([]byte, error) {
	// get deploytargets for environment if the environment already exists
	var deployTarget *schema.DeployTarget
	var activeStanby *schema.DeployTarget
	for _, env := range project.Environments {
		if env.Name == deployData.UnSafeEnvironmentName {
			deployTarget = &env.DeployTarget
		}
		if project.StandbyProductionEnvironment == deployData.UnSafeEnvironmentName || project.ProductionEnvironment == deployData.UnSafeEnvironmentName {
			activeStanby = &env.DeployTarget
		}
	}

	if deployTarget != nil && activeStanby != nil {
		if deployTarget.ID != activeStanby.ID {
			e.Messaging.Publish("lagoon-logs", []byte("environments must be on same deploytarget"))
			return nil, fmt.Errorf("environments must be on same deploytarget")
		}
	}

	if bulkID != "" {
		deployData.BulkID = bulkID
		deployData.BulkName = bulkName
	}

	if deployTarget != nil {
		deployData.DeployTarget = *deployTarget
		buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
		if err != nil {
			e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
			return nil, err
		}
		log.Println("deploy existing environment to specified target", deployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
		e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
		return []byte(buildData.Name), nil
	}

	if len(project.DeployTargetConfigs) > 0 {
		for _, dtc := range project.DeployTargetConfigs {
			switch dtc.Pullrequests {
			case "true":
				deployData.DeployTarget = dtc.DeployTarget
				buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
				if err != nil {
					e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
					return nil, err
				}
				log.Println("deploy environment to project target all pullrequests allowed", dtc.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
				e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
				return []byte(buildData.Name), nil
			case "false":
				e.Messaging.Publish("lagoon-logs", []byte("deployments disabled for target pullrequests"))
				return nil, fmt.Errorf("deployments disabled for project pullrequests")
			default:
				re := regexp.MustCompile(dtc.Pullrequests)
				if re.MatchString(deployData.UnSafeEnvironmentName) {
					deployData.DeployTarget = dtc.DeployTarget
					buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
					if err != nil {
						e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
						return nil, err
					}
					log.Println("deploy environment to project target matching regex pattern", dtc.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
					e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
					return []byte(buildData.Name), nil
				} else {
					e.Messaging.Publish("lagoon-logs", []byte("didn't match regex pattern for target"))
					return nil, fmt.Errorf("didn't match regex pattern for project")
				}
			}
		}
	} else {
		switch project.PullRequests {
		case "true":
			deployData.DeployTarget = *project.DeployTarget
			buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
			if err != nil {
				e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
				return nil, err
			}
			log.Println("deploy environment to deploytarget config defined target all pullrequests allowed", project.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
			e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
			return []byte(buildData.Name), nil
		case "false":
			e.Messaging.Publish("lagoon-logs", []byte("deployments disabled for project pullrequests"))
			return nil, fmt.Errorf("deployments disabled for project pullrequests")
		default:
			re := regexp.MustCompile(project.PullRequests)
			if re.MatchString(deployData.UnSafeEnvironmentName) {
				deployData.DeployTarget = *project.DeployTarget
				buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
				if err != nil {
					e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
					return nil, err
				}
				log.Println("deploy environment to deploytarget config defined target matching regex pattern", project.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
				e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
				return []byte(buildData.Name), nil
			} else {
				e.Messaging.Publish("lagoon-logs", []byte("didn't match regex pattern for project"))
				return nil, fmt.Errorf("didn't match regex pattern for project")
			}
		}
	}
	return nil, fmt.Errorf("nothing to do")
}
