package events

import (
	"fmt"
	"log"
	"strings"

	"github.com/uselagoon/lagoon/internal/lagoon"
	"github.com/uselagoon/machinery/api/schema"
	"github.com/uselagoon/machinery/utils/namespace"
)

func (e *Events) CreateRemoveTask(project schema.Project, unsafeEnvironmentName string) ([]byte, error) {
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
	removeData := lagoon.RemoveData{
		ProjectName: project.Name,
		// @TODO: deprecate `branch` once remote-controller is updated to use this https://github.com/uselagoon/remote-controller/blob/v0.25.0/internal/messenger/consumer.go#L118-L124
		Branch: matchEnv.Name,
		// @TODO: send this now so that phased upgrade of remote-controller can be done while `branch` is still sent
		EnvironmentName: matchEnv.Name,
	}
	log.Println("remove environment from project", matchEnv.Name, project.Name, matchEnv.DeployTarget.Name)
	e.Messaging.SendToLagoonTasks(fmt.Sprintf("%s:remove", matchEnv.DeployTarget.Name), lagoon.RemoveToBytes(&removeData))
	return nil, nil
}
