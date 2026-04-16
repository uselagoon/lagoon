package archive

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"strings"

	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"github.com/uselagoon/machinery/api/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/k8s"
	ilagoon "github.com/uselagoon/lagoon/taskimages/projectclone/internal/lagoon"
	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/types"
)

const archiveFileName = "archive.tar.gz" // name of the archive file we're going to be reading/writing from

// RunArchive runs lagoon-sync archive
func RunArchive(kubeClient client.Client, podName, podNamespace string, payloadData types.PayloadData, dockerComposeFile string) (err error) {
	defer func() {
		if err != nil {
			k8s.AddAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "FAILED")
		}
	}()

	if err = runLagoonSyncArchive(payloadData, dockerComposeFile, fmt.Sprintf("/tmp/%v", archiveFileName)); err != nil {
		return fmt.Errorf("Task failed during lagoon-sync archive, error was: %v\n", err)
	}

	filesToUpload := []string{fmt.Sprintf("/tmp/%v", archiveFileName)}

	lagoonToken, err := ilagoon.GetToken()
	if err != nil {
		return fmt.Errorf("Task failed to get token, error: %v\n", err)
	}

	l := lclient.New(os.Getenv("LAGOON_CONFIG_API_HOST")+"/graphql", "task-projectclone", "v1.0", &lagoonToken, false)

	for _, filePath := range filesToUpload {
		filename := filePath[strings.LastIndex(filePath, "/")+1:]

		// Get upload form from Lagoon API
		raw := fmt.Sprintf(`query { getProjectCloneFileUploadForm(input: {cloneId: %d, filename: "%s"}) {postUrl formFields }}`, payloadData.CloneId, filename)
		projectCloneUpload, err := l.ProcessRaw(context.TODO(), raw, nil)
		if err != nil {
			return fmt.Errorf("Task failed to process raw query, error: %v\n", err)
		}

		// TODO: move to machinery - replicates UploadFileForTask
		projectCloneUploadMap := projectCloneUpload.(map[string]interface{})

		uploadFormBytes, err := json.Marshal(projectCloneUploadMap["getProjectCloneFileUploadForm"])
		if err != nil {
			return fmt.Errorf("Task failed to marshal data, error: %v\n", err)
		}

		var formData schema.FileUploadForm
		if err = json.Unmarshal(uploadFormBytes, &formData); err != nil {
			return fmt.Errorf("Task failed to unmarshal data, error: %v\n", err)
		}

		if err = uploadFile(formData.PostUrl, formData.FormFields, filePath); err != nil {
			return err
		}

	}

	// run the pod annotation
	if err = k8s.AddAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "SOURCE_FILES_UPLOADED"); err != nil {
		return fmt.Errorf("pod annotation failed: %v\n", err)
	}

	return nil
}

func runLagoonSyncArchive(data types.PayloadData, dockerComposeFile, archiveOutputFileName string) error {
	args := []string{
		"archive",
		fmt.Sprintf("--docker-compose-file=%v", dockerComposeFile),
		"--override-volume=/storage/",
		fmt.Sprintf("--archive-output=%v", archiveOutputFileName),
	}

	cmd := exec.Command("/lagoon-sync", args...)
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("PROJECT_NAME=%s", data.ProjectName),
		fmt.Sprintf("ENVIRONMENT_NAME=%s", data.SourceEnvironment),
		fmt.Sprintf("CLONE_ID=%d", data.CloneId),
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		fmt.Printf("lagoon-sync stdout: %s\n", stdout.String())
		fmt.Printf("lagoon-sync stderr: %s\n", stderr.String())
		return fmt.Errorf("lagoon-sync archive failed: %w", err)
	}

	fmt.Printf("lagoon-sync stdout: %s\n", stdout.String())

	return nil
}
