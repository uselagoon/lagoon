package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/archive"
	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/k8s"
	ilagoon "github.com/uselagoon/lagoon/taskimages/projectclone/internal/lagoon"
	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/restore"
	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/types"
)

const (
	dockerComposeYamlFilenameOnDiskTemplate = "docker-compose-*.yml" // this is used to template out a docker-compose.yml file
	waitForK8sDelay                         = 5 * time.Second        // delay before attempting to connect to any external services
)

func main() {
	JSONPayload := os.Getenv("JSON_PAYLOAD")
	podName := os.Getenv("PODNAME")
	podNamespace := os.Getenv("NAMESPACE")

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

	payloadBytes, err := base64.StdEncoding.DecodeString(JSONPayload)
	if err != nil {
		fmt.Printf("Task failed to decode the supplied payload data, error was: %v\n", err)
		os.Exit(1)
	}

	var payloadData types.PayloadData
	if err := json.Unmarshal(payloadBytes, &payloadData); err != nil {
		fmt.Printf("Task failed to unmarshal the supplied payload data, error was: %v\n", err)
		os.Exit(1)
	}

	kubeClient, err := k8s.NewClient()
	if err != nil {
		fmt.Printf("Task failed creating the kubernetes client, error was: %v\n", err)
		os.Exit(1)
	}

	// grab the docker-compose-yaml, write it to a temporary directory
	dcyTempFile, err := os.CreateTemp("/tmp", dockerComposeYamlFilenameOnDiskTemplate)
	if err != nil {
		fmt.Printf("Task failed creating the docker-compose-yaml temp file: %v\n", err)
		os.Exit(1)
	}
	defer os.Remove(dcyTempFile.Name())

	dockerComposeYamlData, err := ilagoon.GetDockerCompose(kubeClient, podNamespace)

	if err != nil {
		fmt.Printf("Task failed pulling the docker-compose-yaml configmap data: %v\n", err)
		os.Exit(1)
	}

	_, err = dcyTempFile.Write([]byte(dockerComposeYamlData))
	if err != nil {
		fmt.Printf("Task failed writing docker-compose-yaml configmap data to file '%v': %v\n", dcyTempFile.Name(), err)
		os.Exit(1)
	}

	if err = dcyTempFile.Close(); err != nil {
		fmt.Printf("Task failed closing docker-compose-yaml configmap file '%v': %v\n", dcyTempFile.Name(), err)
		os.Exit(1)
	}

	// the action will determine fi we're archiving (default) or restoring
	action := payloadData.Action
	if action == "" {
		action = "archive"
	}

	// Here we introduce a short delay - in some cases, k8s isn't ready to allow us to access
	// services from the task pod
	time.Sleep(waitForK8sDelay)

	if action == "restore" {
		if err := restore.RunRestore(kubeClient, podName, podNamespace, payloadData, dcyTempFile.Name()); err != nil {
			fmt.Printf("Task failed during restore, error was: %v\n", err)
			os.Exit(1)
		}
	} else {
		if err := archive.RunArchive(kubeClient, podName, podNamespace, payloadData, dcyTempFile.Name()); err != nil {
			fmt.Printf("Task failed during archive, error was: %v\n", err)
			os.Exit(1)
		}
	}

	fmt.Println("****Task completed successfully****")
}
