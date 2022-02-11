package lagoonclient

import (
	"context"
	"fmt"
	"github.com/Khan/genqlient/graphql"
)

type Project struct {
	Id   int
	Name string
}

type Environment struct {
	Id   int
	Name string
}

type Fact struct {
	Id          int      `json:"id"`
	Environment int      `json:"environment"`
	Name        string   `json:"name"`
	Value       string   `json:"value"`
	Source      string   `json:"source"`
	Description string   `json:"description"`
	KeyFact     bool     `json:"keyFact"`
	Type        FactType `json:"type"`
	Category    string   `json:"category"`
}

type Facts []Fact

func GetProjectByName(ctx context.Context, client graphql.Client, projectName string) (Project, error) {
	var ret Project

	resp, err := getProjectByName(ctx, client, projectName)
	if err != nil {
		return ret, err
	}

	return Project{
		Id:   resp.ProjectByName.Id,
		Name: resp.ProjectByName.Name,
	}, nil
}

func GetEnvironmentFromName(ctx context.Context, client graphql.Client, environmentName string, projectID int) (Environment, error) {
	var ret Environment

	resp, err := getEnvironmentByName(ctx, client, environmentName, projectID)
	if err != nil {
		return ret, err
	}

	return Environment{
		Id:   resp.EnvironmentByName.Id,
		Name: resp.EnvironmentByName.Name,
	}, nil
}

func GetEnvironmentFromID(ctx context.Context, client graphql.Client, environmentID int) (Environment, error) {
	var ret Environment

	resp, err := getEnvironmentFromId(ctx, client, environmentID)
	if err != nil {
		return ret, err
	}

	return Environment{
		Id:   resp.EnvironmentById.Id,
		Name: resp.EnvironmentById.Name,
	}, nil
}

func AddFacts(ctx context.Context, client graphql.Client, facts []AddFactInput) (string, error) {
	resp, err := addFacts(ctx, client, facts)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("Added %d facts", len(resp.AddFacts)), nil
}

func DeleteFactsFromSource(ctx context.Context, client graphql.Client, environmentID int, source string) (string, error) {
	resp, err := deleteFactsFromSource(ctx, client, environmentID, source)
	if err != nil {
		return "", err
	}

	return resp.DeleteFactsFromSource, nil
}
