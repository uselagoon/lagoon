package events

import (
	"fmt"

	"github.com/uselagoon/machinery/api/schema"
)

func (e *Events) createDeployTask(project schema.Project, deployType, environmentName, buildName, sourceUser, bulkID, bulkName string) ([]byte, error) {
	if project.OrganizationDetails != nil {
		for _, env := range project.Environments {
			if env.Name != environmentName {
				if len(project.OrganizationDetails.Environments) >= project.OrganizationDetails.QuotaEnvironment && project.OrganizationDetails.QuotaEnvironment != -1 {
					e.Messaging.Publish("lagoon-logs", []byte("exceed environment quota"))
					return nil, fmt.Errorf("exceed environment quota")
				}
			}
		}
	}
	prodEnvLimit := 2
	// @TODO: handle `/` and `-` branch vs lagoon "made safe" names
	if project.ProductionEnvironment == environmentName || project.StandbyProductionEnvironment == environmentName {
		prodEnvs := []schema.EnvironmentConfig{}
		for _, env := range project.Environments {
			if env.EnvironmentType == schema.ProductionEnv {
				prodEnvs = append(prodEnvs, env)
			}
		}
		if len(prodEnvs) >= prodEnvLimit {
			exists := false
			for _, env := range prodEnvs {
				if env.Name == environmentName {
					exists = true
				}
			}
			if !exists {
				e.Messaging.Publish("lagoon-logs", []byte("exceed production limit"))
				return nil, fmt.Errorf("exceed production limit")
			}
		}
	} else {
		devEnvs := []schema.EnvironmentConfig{}
		for _, env := range project.Environments {
			if env.EnvironmentType == schema.DevelopmentEnv {
				devEnvs = append(devEnvs, env)
			}
		}
		if project.DevelopmentEnvironmentsLimit != nil && len(devEnvs) >= int(*project.DevelopmentEnvironmentsLimit) {
			exists := false
			for _, env := range devEnvs {
				if env.Name == environmentName {
					exists = true
				}
			}
			if !exists {
				e.Messaging.Publish("lagoon-logs", []byte("exceed development limit"))
				return nil, fmt.Errorf("exceed development limit")
			}
		}
	}

	switch deployType {
	case "push":
		return e.deployPush(project, environmentName, buildName, sourceUser, bulkID, bulkName)
	case "pull":
		return e.deployPull(project, environmentName, buildName, sourceUser, bulkID, bulkName)
	}
	return nil, fmt.Errorf("nothing to do")
}
