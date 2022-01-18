package lagoonclient

import (
	"context"
	"fmt"
	"github.com/Khan/genqlient/graphql"
)

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

type Environment struct {
	Id   int
	Name string
}

func GetEnvironmentFromId(ctx context.Context, client graphql.Client, environmentId int) (Environment, error) {
	var ret Environment

	resp, err := getEnvironmentFromId(ctx, client, environmentId)
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

func DeleteFactsFromSource(ctx context.Context, client graphql.Client, environmentId int, source string) (string, error) {
	resp, err := deleteFactsFromSource(ctx, client, environmentId, source)
	if err != nil {
		return "", err
	}

	return resp.DeleteFactsFromSource, nil
}
