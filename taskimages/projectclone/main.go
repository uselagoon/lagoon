package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"os/exec"
	"strings"

	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

// Placeholder struct until archive cmd is defined
type PayloadData struct {
	ProjectName       string `json:"projectName"`
	SourceEnvironment string `json:"sourceEnvironment"`
	CloneId           int    `json:"cloneId"`
}

type taskData struct {
	CloneId int    `json:"cloneId"`
	Status  string `json:"status"`
}

// We need to annotate the pod with lagoon.sh/taskData + return the job data for the actions-handler
func addAnnotation(c client.Client, podName, podNamespace string, cloneId int, status string) error {
	result := taskData{
		CloneId: cloneId,
		Status:  status,
	}

	jsonData, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal result: %w", err)
	}

	pod := corev1.Pod{}
	if err := c.Get(context.Background(), types.NamespacedName{
		Namespace: podNamespace,
		Name:      podName,
	}, &pod); err != nil {
		return fmt.Errorf("task failed to get the pod to update: %w", err)
	}

	// job data to add as annotation
	mergePatch, err := json.Marshal(map[string]interface{}{
		"metadata": map[string]interface{}{
			"annotations": map[string]interface{}{
				"lagoon.sh/taskData": base64.StdEncoding.EncodeToString(jsonData),
			},
		},
	})
	if err != nil {
		return fmt.Errorf("failed to create merge patch: %w", err)
	}

	// update the pod with the annotation
	if err := c.Patch(context.Background(), &pod, client.RawPatch(types.MergePatchType, mergePatch)); err != nil {
		return fmt.Errorf("failed to patch pod with result: %w", err)
	}

	return nil
}

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

	var payloadData PayloadData
	if err := json.Unmarshal(payloadBytes, &payloadData); err != nil {
		fmt.Printf("Task failed to unmarshal the supplied payload data, error was: %v\n", err)
		os.Exit(1)
	}

	// read the serviceaccount deployer token first.
	token, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		// read the legacy deployer token if for some reason the serviceaccount is not found.
		token, err = os.ReadFile("/var/run/secrets/lagoon/deployer/token")
		if err != nil {
			fmt.Printf("Task failed to find kubernetes token to use, error was: %v\n", err)
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
	kubeClient, err := client.New(config, client.Options{})
	if err != nil {
		fmt.Printf("Task failed creating the kubernetes client, error was: %v\n", err)
		os.Exit(1)
	}

	// Run lagoon-sync archive
	if err := runLagoonSyncArchive(payloadData); err != nil {
		fmt.Printf("Task failed during lagoon-sync archive, error was: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("*********Lagoon sync archive completed: %s*********\n", payloadData.ProjectName)

	// TODO: Upload archived files to S3
	// test file creation (placeholder for actual S3 upload)
	file, err := os.Create("/tmp/testfile.txt")
	if err != nil {
		fmt.Printf("Task failed to create test file, error: %v\n", err)
		os.Exit(1)
	}
	defer file.Close()

	_, err = file.WriteString("This is a test file for project clone.")
	if err != nil {
		fmt.Printf("Task failed to write to test file, error: %v\n", err)
		os.Exit(1)
	}

	// Get upload form from Lagoon API
	raw := fmt.Sprintf(`query { getProjectCloneFileUploadForm(input: {cloneId: %d, filename: "testfile.txt"}) {postUrl formFields }}`, payloadData.CloneId)

	lagoonToken, err := getToken()
	if err != nil {
		fmt.Printf("Task failed to get token, error: %v\n", err)
		os.Exit(1)
	}

	l := lclient.New(os.Getenv("LAGOON_CONFIG_API_HOST")+"/graphql", "task-projectclone", "v1.0", &lagoonToken, false)
	projectCloneUpload, err := l.ProcessRaw(context.TODO(), raw, nil)
	if err != nil {
		fmt.Printf("Task failed to process raw query, error: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("*********projectCloneUpload %v*********\n", projectCloneUpload)

	// TODO: move to machinery - replicates UploadFileForTask
	projectCloneUploadMap := projectCloneUpload.(map[string]interface{})

	uploadFormBytes, err := json.Marshal(projectCloneUploadMap["getProjectCloneFileUploadForm"])
	if err != nil {
		fmt.Printf("Task failed to marshal data, error: %v\n", err)
		os.Exit(1)
	}

	var formData schema.FileUploadForm
	if err := json.Unmarshal(uploadFormBytes, &formData); err != nil {
		fmt.Printf("Task failed to unmarshal data, error: %v\n", err)
		os.Exit(1)
	}

	requestForm := new(bytes.Buffer)
	writer := multipart.NewWriter(requestForm)

	for name, value := range formData.FormFields {
		err := writer.WriteField(name, value)
		if err != nil {
			fmt.Printf("couldn't write upload form field %s: %v\n", name, err)
			os.Exit(1)
		}
	}

	fileField, err := writer.CreateFormFile("file", "testfile.txt")
	if err != nil {
		fmt.Printf("Task couldn't create upload file field, error: %v\n", err)
		os.Exit(1)
	}

	fd, err := os.Open("/tmp/testfile.txt")
	if err != nil {
		fmt.Printf("Task couldn't read file, error: %v\n", err)
		os.Exit(1)
	}
	defer fd.Close()

	_, err = io.Copy(fileField, fd)
	if err != nil {
		fmt.Printf("Task couldn't copy file, error: %v\n", err)
		os.Exit(1)
	}

	writer.Close()

	client := &http.Client{}
	req, err := http.NewRequest("POST", formData.PostUrl, requestForm)
	if err != nil {
		fmt.Printf("Task couldn't create HTTP request, error: %v\n", err)
		os.Exit(1)
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Task couldn't upload file, error: %v\n", err)
		os.Exit(1)
	}
	defer resp.Body.Close()

	bodyText, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Task couldn't read S3 upload response, error: %v\n", err)
		os.Exit(1)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		fmt.Printf("Task couldn't upload file (HTTP %d): %s\n", resp.StatusCode, bodyText)
		os.Exit(1)
	}

	fmt.Println("*********File uploaded to S3 successfully*********")

	// run the pod annotation
	if err := addAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "SOURCE_FILES_UPLOADED"); err != nil {
		fmt.Printf("pod annotation failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("****Task completed successfully****")
}

func runLagoonSyncArchive(data PayloadData) error {

	// cmd := exec.Command("/lagoon-sync", "archive")
	// cmd.Env = append(os.Environ(),
	// 	fmt.Sprintf("PROJECT_NAME=%s", data.ProjectName),
	// 	fmt.Sprintf("ENVIRONMENT_NAME=%s", data.SourceEnvironment),
	// 	fmt.Sprintf("CLONE_ID=%s", data.CloneId),
	// )

	// if err := cmd.Run(); err != nil {
	// 	return fmt.Errorf("lagoon-sync archive failed: %w", err)
	// }

	fmt.Printf("*********Lagoon sync archive run: %s*********\n", data.ProjectName)

	return nil
}

func getToken() (string, error) {
	cmd := exec.Command("ssh",
		"-p", os.Getenv("LAGOON_CONFIG_TOKEN_PORT"),
		"-o", "StrictHostKeyChecking=no",
		"-o", "UserKnownHostsFile=/dev/null",
		"-i", "/var/run/secrets/lagoon/ssh/ssh-privatekey",
		fmt.Sprintf("lagoon@%s", os.Getenv("LAGOON_CONFIG_TOKEN_HOST")),
		"token",
	)

	var out bytes.Buffer
	cmd.Stdout = &out

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("ssh token cmd failed: %v", err)
	}

	token := strings.TrimSpace(out.String())
	if token == "" {
		return "", fmt.Errorf("Empty token from ssh cmd")
	}

	return token, nil
}
