package lagoonclient

import (
	"context"
	"github.com/Khan/genqlient/graphql"
)

type Workflow struct {
	Id int
	AdvancedTaskId int
	AdvancedTaskDetails string
}

func GetEnvironmentWorkflows(ctx context.Context, client graphql.Client, projectId int, environmentName string) ([]Workflow, error) {
	var ret []Workflow
	resp, err := getEnvironmentWorkflows(ctx, client, projectId, environmentName)
	if err != nil {
		return ret, err
	}

	for _, workflow := range resp.EnvironmentByName.Workflows {
		newWorkflow := Workflow{Id: workflow.Id}
		if commandTask, ok := workflow.AdvancedTaskDefinition.(*getEnvironmentWorkflowsEnvironmentByNameEnvironmentWorkflowsWorkflowAdvancedTaskDefinitionAdvancedTaskDefinitionCommand); ok {
			newWorkflow.AdvancedTaskId = commandTask.Id
		} else if imageTask, ok := workflow.AdvancedTaskDefinition.(*getEnvironmentWorkflowsEnvironmentByNameEnvironmentWorkflowsWorkflowAdvancedTaskDefinitionAdvancedTaskDefinitionImage); ok {
			newWorkflow.AdvancedTaskId = imageTask.Id
		}
		ret = append(ret, newWorkflow)
	}

	return ret, nil
}
