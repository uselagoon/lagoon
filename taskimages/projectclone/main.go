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

type CloneFile struct {
	ID       int    `json:"id"`
	Filename string `json:"filename"`
}

// Placeholder struct until archive cmd is defined
type PayloadData struct {
	ProjectName            string      `json:"projectName"`
	SourceEnvironment      string      `json:"sourceEnvironment,omitempty"`
	DestinationEnvironment string      `json:"destinationEnvironment,omitempty"`
	CloneId                int         `json:"cloneId"`
	Action                 string      `json:"action,omitempty"` // "archive"/"restore"
	Files                  []CloneFile `json:"files,omitempty"`
}

type taskData struct {
	CloneId int    `json:"cloneId"`
	Status  string `json:"status"`
}

const (
	dockerComposeYamlCMName                 = "docker-compose-yaml"  // the configMap we read the docker-compose.yml details from
	dockerComposeYamlCMKey                  = "post-deploy"          // key that contains the docker-compose.yml details we're interested in
	dockerComposeYamlFilenameOnDiskTemplate = "docker-compose-*.yml" // this is used to template out a docker-compose.yml file
)

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

	// grab the docker-compose-yaml, write it to a temporary directory
	dcyTempFile, err := os.CreateTemp("/tmp", dockerComposeYamlFilenameOnDiskTemplate)
	if err != nil {
		fmt.Printf("Task failed creating the docker-compose-yaml temp file: %v\n", err)
		os.Exit(1)
	}
	defer os.Remove(dcyTempFile.Name())

	dockerComposeYamlData, err := getDockerCompose(kubeClient, podNamespace)

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

	if action == "restore" {
		if err := runRestore(kubeClient, podName, podNamespace, payloadData); err != nil {
			fmt.Printf("Task failed during restore, error was: %v\n", err)
			os.Exit(1)
		}
	} else {
		if err := runArchive(kubeClient, podName, podNamespace, payloadData); err != nil {
			fmt.Printf("Task failed during archive, error was: %v\n", err)
			os.Exit(1)
		}
	}

	fmt.Println("****Task completed successfully****")
}

// archive func for action split
func runArchive(kubeClient client.Client, podName, podNamespace string, payloadData PayloadData) error {
	// Run lagoon-sync archive
	if err := runLagoonSyncArchive(payloadData); err != nil {
		return fmt.Errorf("Task failed during lagoon-sync archive, error was: %v\n", err)
	}

	fmt.Printf("*********Lagoon sync archive completed: %s*********\n", payloadData.ProjectName)

	// TODO: Replace with actual lagoon-sync archive output files
	filesToUpload := []string{"/tmp/testfile.txt"}
	for _, file := range filesToUpload {
		f, err := os.Create(file)
		if err != nil {
			return fmt.Errorf("Task failed to create test file %s: %v", file, err)
		}
		_, err = f.WriteString("This is a test file for project clone.")
		f.Close()
		if err != nil {
			return fmt.Errorf("Task failed to write to test file %s: %v", file, err)
		}
	}

	lagoonToken, err := getToken()
	if err != nil {
		return fmt.Errorf("Task failed to get token, error: %v\n", err)
	}

	l := lclient.New(os.Getenv("LAGOON_CONFIG_API_HOST")+"/graphql", "task-projectclone", "v1.0", &lagoonToken, false)

	for _, filePath := range filesToUpload {
		filename := filePath[strings.LastIndex(filePath, "/")+1:]
		fmt.Printf("*********Uploading file: %s*********", filename)

		// Get upload form from Lagoon API
		raw := fmt.Sprintf(`query { getProjectCloneFileUploadForm(input: {cloneId: %d, filename: "%s"}) {postUrl formFields }}`, payloadData.CloneId, filename)
		projectCloneUpload, err := l.ProcessRaw(context.TODO(), raw, nil)
		if err != nil {
			return fmt.Errorf("Task failed to process raw query, error: %v\n", err)
		}
		fmt.Printf("*********projectCloneUpload %v*********\n", projectCloneUpload)

		// TODO: move to machinery - replicates UploadFileForTask
		projectCloneUploadMap := projectCloneUpload.(map[string]interface{})

		uploadFormBytes, err := json.Marshal(projectCloneUploadMap["getProjectCloneFileUploadForm"])
		if err != nil {
			return fmt.Errorf("Task failed to marshal data, error: %v\n", err)
		}

		var formData schema.FileUploadForm
		if err := json.Unmarshal(uploadFormBytes, &formData); err != nil {
			return fmt.Errorf("Task failed to unmarshal data, error: %v\n", err)
		}

		requestForm := new(bytes.Buffer)
		writer := multipart.NewWriter(requestForm)

		for name, value := range formData.FormFields {
			err := writer.WriteField(name, value)
			if err != nil {
				return fmt.Errorf("couldn't write upload form field %s: %v\n", name, err)
			}
		}

		fileField, err := writer.CreateFormFile("file", filename)
		if err != nil {
			return fmt.Errorf("Task couldn't create upload file field, error: %v\n", err)
		}

		fd, err := os.Open(filePath)
		if err != nil {
			return fmt.Errorf("Task couldn't read file, error: %v\n", err)
		}

		_, err = io.Copy(fileField, fd)
		fd.Close()
		if err != nil {
			return fmt.Errorf("Task couldn't copy file, error: %v\n", err)
		}

		writer.Close()

		httpClient := &http.Client{}
		req, err := http.NewRequest("POST", formData.PostUrl, requestForm)
		if err != nil {
			return fmt.Errorf("Task couldn't create HTTP request, error: %v\n", err)
		}

		req.Header.Set("Content-Type", writer.FormDataContentType())
		resp, err := httpClient.Do(req)
		if err != nil {
			return fmt.Errorf("Task couldn't upload file, error: %v\n", err)
		}

		bodyText, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			return fmt.Errorf("Task couldn't read S3 upload response, error: %v\n", err)
		}

		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
			return fmt.Errorf("Task couldn't upload file %s (HTTP %d): %s", filename, resp.StatusCode, bodyText)
		}

		fmt.Printf("*********File %s uploaded to S3 successfully*********\n", filename)
	}

	// run the pod annotation
	if err := addAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "SOURCE_FILES_UPLOADED"); err != nil {
		return fmt.Errorf("pod annotation failed: %v\n", err)
	}

	return nil
}

func downloadFile(downloadURL, dest string) error {
	resp, err := http.Get(downloadURL)
	if err != nil {
		return fmt.Errorf("http get failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download error: %d", resp.StatusCode)
	}

	outFile, err := os.Create(dest)
	if err != nil {
		return fmt.Errorf("create file err %s: %w", dest, err)
	}
	defer outFile.Close()

	if _, err := io.Copy(outFile, resp.Body); err != nil {
		return fmt.Errorf("write file err %s: %w", dest, err)
	}
	return nil
}

// restore func for action split
func runRestore(kubeClient client.Client, podName, podNamespace string, payloadData PayloadData) error {
	fmt.Printf("*****CloneId %d DestinationEnvironment %s*******\n", payloadData.CloneId, payloadData.DestinationEnvironment)
	fmt.Println("*********Restore run*********")

	if len(payloadData.Files) == 0 {
		return fmt.Errorf("no files found for cloneId %d", payloadData.CloneId)
	}

	lagoonToken, err := getToken()
	if err != nil {
		return fmt.Errorf("failed to get token: %w", err)
	}

	l := lclient.New(os.Getenv("LAGOON_CONFIG_API_HOST")+"/graphql", "task-projectclone", "v1.0", &lagoonToken, false)

	for _, file := range payloadData.Files {
		fmt.Printf("*********Downloading file: %s (id: %d)*********", file.Filename, file.ID)

		raw := fmt.Sprintf("query { getDownloadLinkByProjectCloneFileId(cloneId: %d, fileId: %d) }", payloadData.CloneId, file.ID)
		cloneDownloadLink, err := l.ProcessRaw(context.TODO(), raw, nil)
		if err != nil {
			return fmt.Errorf("downlod link failure %s: %w", file.Filename, err)
		}

		linkMap := cloneDownloadLink.(map[string]interface{})
		downloadURL := linkMap["getDownloadLinkByProjectCloneFileId"].(string)
		if downloadURL == "" {
			return fmt.Errorf("downlaod url failed for file %s", file.Filename)
		}

		dest := fmt.Sprintf("/tmp/%s", file.Filename)
		if err := downloadFile(downloadURL, dest); err != nil {
			return fmt.Errorf("failed to download file %s: %w", file.Filename, err)
		}
		fmt.Printf("*********Downloaded file %s to %s*********", file.Filename, dest)
	}

	// TODO: run lagoon-sync restore with the downloaded files

	// run the pod annotation
	if err := addAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "SOURCE_FILES_APPLIED"); err != nil {
		return fmt.Errorf("pod annotation failed: %w", err)
	}

	return nil
}

func getDockerCompose(c client.Client, podNamespace string) (string, error) {

	cm := corev1.ConfigMap{}
	if err := c.Get(context.TODO(), types.NamespacedName{
		Namespace: podNamespace,
		Name:      dockerComposeYamlCMName,
	}, &cm); err != nil {
		return "", fmt.Errorf("task failed to get the docker-compose ConfigMap: %w", err)
	}

	data, ok := cm.Data[dockerComposeYamlCMKey]
	if !ok {
		return "", fmt.Errorf("unable to find key %q in configmap %q", dockerComposeYamlCMKey, dockerComposeYamlCMName)
	}

	return data, nil
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
