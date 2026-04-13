package restore

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"

	lclient "github.com/uselagoon/machinery/api/lagoon/client"
	"sigs.k8s.io/controller-runtime/pkg/client"

	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/k8s"
	ilagoon "github.com/uselagoon/lagoon/taskimages/projectclone/internal/lagoon"
	"github.com/uselagoon/lagoon/taskimages/projectclone/internal/types"
)

// RunRestore downloads archive files and extracts them
func RunRestore(kubeClient client.Client, podName, podNamespace string, payloadData types.PayloadData, dockerComposeFile string) (err error) {
	fmt.Printf("*****CloneId %d DestinationEnvironment %s*******", payloadData.CloneId, payloadData.DestinationEnvironment)

	fmt.Println("*********Restore run*********")

	defer func() {
		if err != nil {
			k8s.AddAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "FAILED")
		}
	}()

	if len(payloadData.Files) == 0 {
		return fmt.Errorf("no files found for cloneId %d", payloadData.CloneId)
	}

	lagoonToken, err := ilagoon.GetToken()
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
		if err = downloadFile(downloadURL, dest); err != nil {
			return fmt.Errorf("failed to download file %s: %w", file.Filename, err)
		}
		fmt.Printf("*********Downloaded file %s to %s*********", file.Filename, dest)

		// we assume this file is a lagoon-archive for now
		err = runLagoonSyncExtract(payloadData, dest)
		if err != nil {
			return fmt.Errorf("failed to lagoon-archive extract file %s: %w", file.Filename, err)
		}
	}

	// run the pod annotation
	if err = k8s.AddAnnotation(kubeClient, podName, podNamespace, payloadData.CloneId, "SOURCE_FILES_APPLIED"); err != nil {
		return fmt.Errorf("pod annotation failed: %w", err)
	}

	return nil
}

func runLagoonSyncExtract(data types.PayloadData, archiveInputFileName string) error {
	args := []string{
		"extract",
		fmt.Sprintf("--archive-input=%v", archiveInputFileName),
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
		return fmt.Errorf("lagoon-sync extract failed: %w", err)
	}
	fmt.Printf("lagoon-sync stdout: %s\n", stdout.String())

	fmt.Printf("*********Lagoon sync extract run: %s*********\n", data.ProjectName)

	return nil
}
