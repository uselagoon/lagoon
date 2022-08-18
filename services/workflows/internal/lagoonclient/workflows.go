package lagoonclient

import (
	"context"
	"github.com/Khan/genqlient/graphql"
)

type Workflow struct {
	Id int
	AdvancedTaskId int
	AdvancedTaskDetails string
	EnvironmentId int
	EnvironmentName string
}


func InvokeWorkflowOnEnvironment(ctx context.Context, client graphql.Client, environmentId int, advancedTaskDefinition int) (string, error) {
	resp, err := invokeCustomTask(ctx, client, environmentId, advancedTaskDefinition)
	if err != nil {
		return "", err
	}
	return resp.InvokeRegisteredTask.Status, nil
}

func GetEnvironmentWorkflowsByEnvironmentId(ctx context.Context, client graphql.Client, environmentId int) ([]Workflow, error) {
	var ret []Workflow
	resp, err := getEnvironmentByIdWorkflows(ctx, client, environmentId)

	if err != nil {
		return ret, err
	}
	for _, workflow := range resp.EnvironmentById.Workflows {
		newWorkflow := Workflow{Id: workflow.Id, AdvancedTaskDetails: workflow.Event, EnvironmentName: resp.EnvironmentById.Name, EnvironmentId: resp.EnvironmentById.Id}
		if commandTask, ok := workflow.AdvancedTaskDefinition.(*getEnvironmentByIdWorkflowsEnvironmentByIdEnvironmentWorkflowsWorkflowAdvancedTaskDefinitionAdvancedTaskDefinitionCommand); ok {
			newWorkflow.AdvancedTaskId = commandTask.Id
		} else if imageTask, ok := workflow.AdvancedTaskDefinition.(*getEnvironmentByIdWorkflowsEnvironmentByIdEnvironmentWorkflowsWorkflowAdvancedTaskDefinitionAdvancedTaskDefinitionImage); ok {
			newWorkflow.AdvancedTaskId = imageTask.Id
		}
		ret = append(ret, newWorkflow)
	}

	return ret, nil
}


func GetEnvironmentWorkflows(ctx context.Context, client graphql.Client, projectId int, environmentName string) ([]Workflow, error) {
	var ret []Workflow
	resp, err := getEnvironmentWorkflows(ctx, client, projectId, environmentName)

	if err != nil {
		return ret, err
	}
	for _, workflow := range resp.EnvironmentByName.Workflows {
		newWorkflow := Workflow{Id: workflow.Id, AdvancedTaskDetails: workflow.Event, EnvironmentName: resp.EnvironmentByName.Name, EnvironmentId: resp.EnvironmentByName.Id}
		if commandTask, ok := workflow.AdvancedTaskDefinition.(*getEnvironmentWorkflowsEnvironmentByNameEnvironmentWorkflowsWorkflowAdvancedTaskDefinitionAdvancedTaskDefinitionCommand); ok {
			newWorkflow.AdvancedTaskId = commandTask.Id
		} else if imageTask, ok := workflow.AdvancedTaskDefinition.(*getEnvironmentWorkflowsEnvironmentByNameEnvironmentWorkflowsWorkflowAdvancedTaskDefinitionAdvancedTaskDefinitionImage); ok {
			newWorkflow.AdvancedTaskId = imageTask.Id
		}
		ret = append(ret, newWorkflow)
	}

	return ret, nil
}
