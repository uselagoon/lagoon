package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	"github.com/uselagoon/lagoon/taskimages/activestandby/dioscuri"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func main() {
	// get the values from the provided environment variables.
	JSONPayload := os.Getenv("JSON_PAYLOAD")
	podName := os.Getenv("PODNAME")
	podNamespace := os.Getenv("NAMESPACE")
	// check that they aren't empty.
	if JSONPayload == "" {
		fmt.Println("Task failed, error was: no payload provided")
		os.Exit(1)
	}
	if podName == "" {
		fmt.Println("Task failed, error was: no podname provided")
		os.Exit(1)
	}
	if podNamespace == "" {
		fmt.Println("Task failed, error was: no podnamespace provided")
		os.Exit(1)
	}

	// read the serviceaccount deployer token first.
	token, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		// read the legacy deployer token if for some reason the serviceaccount is not found.
		token, err = os.ReadFile("/var/run/secrets/lagoon/deployer/token")
		if err != nil {
			fmt.Println(fmt.Sprintf("Task failed to find a kubernetes token to use, error was: %v", err))
			os.Exit(1)
		}
	}
	// generate the rest config for the client.
	config := &rest.Config{
		BearerToken: string(token),
		Host:        "https://kubernetes.default.svc",
		TLSClientConfig: rest.TLSClientConfig{
			Insecure: true,
		},
	}
	// create the client using the rest config.
	c, err := client.New(config, client.Options{})
	if err != nil {
		fmt.Println(fmt.Sprintf("Task failed creating the kubernetes client, error was: %v", err))
		os.Exit(1)
	}

	// decode the payload data and unmarshal it.
	payloadBytes, err := base64.StdEncoding.DecodeString(JSONPayload)
	if err != nil {
		fmt.Println(fmt.Sprintf("Task failed to decode the supplied payload data, error was: %v", err))
		os.Exit(1)
	}
	var payloadData map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &payloadData); err != nil {
		fmt.Println(fmt.Sprintf("Task failed to unsmarshal the supplied payload data, error was: %v", err))
		os.Exit(1)
	}

	// seed the return data with the initial data
	rData := dioscuri.ReturnData{
		SourceNamespace:             payloadData["sourceNamespace"].(string),
		DestinationNamespace:        payloadData["destinationNamespace"].(string),
		ProductionEnvironment:       payloadData["productionEnvironment"].(string),
		StandbyProdutionEnvironment: payloadData["standbyEnvironment"].(string),
	}

	err = dioscuri.RunMigration(c, rData, podName, podNamespace)
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}
