package events

import (
	"fmt"
	"strings"

	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
)

func (e *Events) createRemoveTask(project schema.Project, deployType, unsafeEnvironmentName string) ([]byte, error) {
	environmentName := namespace.ShortenEnvironment(project.Name, namespace.MakeSafe(unsafeEnvironmentName))
	var matchEnv schema.Environment
	if project.ProductionEnvironment == unsafeEnvironmentName ||
		project.StandbyProductionEnvironment == unsafeEnvironmentName ||
		project.ProductionEnvironment == environmentName ||
		project.StandbyProductionEnvironment == environmentName {
		prodEnvs := []schema.EnvironmentConfig{}
		for _, env := range project.Environments {
			if string(env.EnvironmentType) == strings.ToLower(string(schema.ProductionEnv)) {
				prodEnvs = append(prodEnvs, env)
			}
		}
		exists := false
		for _, env := range prodEnvs {
			if env.Name == unsafeEnvironmentName || env.Name == environmentName {
				exists = true
			}
		}
		if exists {
			e.Messaging.Publish("lagoon-logs", []byte(fmt.Sprintf("%s is defined as the production environment for %s, refusing to remove", environmentName, project.Name)))
			return nil, fmt.Errorf("%s is defined as the production environment for %s, refusing to remove", environmentName, project.Name)
		}
	}
	for _, env := range project.Environments {
		if env.Name == environmentName || env.Name == unsafeEnvironmentName {
			matchEnv = env.Environment
		}
	}
	if matchEnv.Name == "" {
		e.Messaging.Publish("lagoon-logs", []byte("skipped"))
		return nil, fmt.Errorf("skipped")
	}
	switch deployType {
	case "push":
		return e.removePush(project, matchEnv)
	case "pull":
		return e.removePull(project, matchEnv)
	}
	return nil, nil
}
