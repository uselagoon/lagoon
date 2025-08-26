package events

import (
	"fmt"
	"log"

	// we can't use go regex as some things people do with the regex in nodejs aren't supported in golang re2 regex
	"github.com/dlclark/regexp2"

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) deployPush(project schema.Project, deployData lagoon.DeployData) ([]byte, error) {
	// get deploytargets for environment if the environment already exists
	var deployTarget *schema.DeployTarget
	var activeStandby *schema.DeployTarget
	for _, env := range project.Environments {
		if env.Name == deployData.UnsafeEnvironmentName {
			deployTarget = &env.DeployTarget
		}
		if project.StandbyProductionEnvironment == deployData.UnsafeEnvironmentName || project.ProductionEnvironment == deployData.UnsafeEnvironmentName {
			activeStandby = &env.DeployTarget
		}
	}

	if deployTarget != nil && activeStandby != nil {
		if deployTarget.ID != activeStandby.ID {
			return nil, fmt.Errorf("environments must be on same deploytarget")
		}
	}

	if deployTarget != nil {
		deployData.DeployTarget = *deployTarget
		buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
		if err != nil {
			return nil, err
		}
		log.Println("deploy existing environment to specified target", deployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
		e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
		return []byte(buildData.Name), nil
	}

	if len(project.DeployTargetConfigs) > 0 {
		for _, dtc := range project.DeployTargetConfigs {
			switch dtc.Branches {
			case "true":
				deployData.DeployTarget = dtc.DeployTarget
				buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
				if err != nil {
					e.Messaging.Publish("lagoon-logs", []byte(err.Error()))
					return nil, err
				}
				log.Println("deploy environment to project target all branches allowed", dtc.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
				e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
				return []byte(buildData.Name), nil
			case "false":
				return nil, fmt.Errorf("deployments disabled for project branches")
			default:
				re := regexp2.MustCompile(dtc.Branches, 0)
				if match, _ := re.MatchString(deployData.UnsafeEnvironmentName); match {
					deployData.DeployTarget = dtc.DeployTarget
					buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
					if err != nil {
						return nil, err
					}
					log.Println("deploy environment to project target matching regex pattern", dtc.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
					e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
					return []byte(buildData.Name), nil
				} else {
					return nil, fmt.Errorf("didn't match regex pattern for deploytarget")
				}
			}
		}
	} else {
		switch project.Branches {
		case "true":
			deployData.DeployTarget = *project.DeployTarget
			buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
			if err != nil {
				return nil, err
			}
			log.Println("deploy environment to deploytarget config defined target all branches allowed", project.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
			e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
			return []byte(buildData.Name), nil
		case "false":
			return nil, fmt.Errorf("deployments disabled for project branches")
		default:
			re := regexp2.MustCompile(project.Branches, 0)
			if match, _ := re.MatchString(deployData.UnsafeEnvironmentName); match {
				deployData.DeployTarget = *project.DeployTarget
				buildData, err := e.LagoonAPI.GetControllerBuildData(deployData)
				if err != nil {
					return nil, err
				}
				log.Println("deploy environment to deploytarget config defined target matching regex pattern", project.DeployTarget.Name, buildData.Spec.Project.Environment, buildData.Name)
				e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:builddeploy", deployData.DeployTarget.Name), lagoon.BuildToBytes(buildData))
				return []byte(buildData.Name), nil
			} else {
				return nil, fmt.Errorf("didn't match regex pattern for project")
			}
		}
	}
	return nil, fmt.Errorf("nothing to do")
}
