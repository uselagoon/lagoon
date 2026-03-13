package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
)

// Placeholder struct until archive cmd is defined
type PayloadData struct {
	ProjectName       string `json:"projectName"`
	SourceEnvironment string `json:"sourceEnvironment"`
	CloneId           string `json:"cloneId"`
}

func main() {
	JSONPayload := os.Getenv("JSON_PAYLOAD")
	if JSONPayload == "" {
		fmt.Println("Task failed, error was: no payload provided")
		os.Exit(1)
	}

	payloadBytes, err := base64.StdEncoding.DecodeString(JSONPayload)
	if err != nil {
		fmt.Printf("Task failed to decode the supplied payload data, error was: %v\n", err)
		os.Exit(1)
	}

	var payloadData PayloadData
	if err := json.Unmarshal(payloadBytes, &payloadData); err != nil {
		fmt.Printf("Task failed to unmarshal the supplied payload data, error was: %v\n", err)
		os.Exit(1)
	}

	if err := runLagoonSyncArchive(payloadData); err != nil {
		fmt.Printf("Task failed during lagoon-sync archive, error was: %v\n", err)
		os.Exit(1)
	}

	// TODO: Upload file getProjectCloneFileUploadForm
	// get token for api via ssh?

	// TODO: Update ProjectClone status to SOURCE_FILES_UPLOADED
}

func runLagoonSyncArchive(data PayloadData) error {

	cmd := exec.Command("/lagoon-sync", "archive")
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("PROJECT_NAME=%s", data.ProjectName),
		fmt.Sprintf("ENVIRONMENT_NAME=%s", data.SourceEnvironment),
		fmt.Sprintf("CLONE_ID=%s", data.CloneId),
	)

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("lagoon-sync archive failed: %w", err)
	}

	return nil
}
