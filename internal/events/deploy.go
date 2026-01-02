package events

import (
	"fmt"
	"strings"

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
)

func (e *Events) CreateDeployTask(project schema.Project, deployData lagoon.DeployData) ([]byte, error) {
	environmentName := namespace.ShortenEnvironment(project.Name, namespace.MakeSafe(deployData.UnsafeEnvironmentName))
	if project.OrganizationDetails != nil {
		for _, env := range project.Environments {
			if env.Name != deployData.UnsafeEnvironmentName {
				if len(project.OrganizationDetails.Environments) >= project.OrganizationDetails.QuotaEnvironment && project.OrganizationDetails.QuotaEnvironment != -1 {
					return nil, fmt.Errorf("exceed environment quota")
				}
			}
		}
	}
	prodEnvLimit := 2
	// @TODO: handle `/` and `-` branch vs lagoon "made safe" names
	if project.ProductionEnvironment == deployData.UnsafeEnvironmentName ||
		project.StandbyProductionEnvironment == deployData.UnsafeEnvironmentName ||
		project.ProductionEnvironment == environmentName ||
		project.StandbyProductionEnvironment == environmentName {
		prodEnvs := []schema.EnvironmentConfig{}
		for _, env := range project.Environments {
			if string(env.EnvironmentType) == strings.ToLower(string(schema.ProductionEnv)) {
				prodEnvs = append(prodEnvs, env)
			}
		}
		if len(prodEnvs) >= prodEnvLimit {
			exists := false
			for _, env := range prodEnvs {
				if env.Name == deployData.UnsafeEnvironmentName || env.Name == environmentName {
					exists = true
				}
			}
			if !exists {
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
				if env.Name == deployData.UnsafeEnvironmentName {
					exists = true
				}
			}
			if !exists {
				return nil, fmt.Errorf("exceed development limit")
			}
		}
	}

	switch deployData.DeployType {
	case schema.Branch:
		return e.deployPush(project, deployData)
	case schema.PullRequest:
		return e.deployPull(project, deployData)
	case schema.Promote:
		return e.deployPromote(project, deployData)
	}
	return nil, fmt.Errorf("")
}
