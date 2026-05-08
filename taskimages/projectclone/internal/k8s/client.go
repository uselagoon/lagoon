package k8s

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/rest"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type taskData struct {
	CloneId int    `json:"cloneId"`
	Status  string `json:"status"`
}

func NewClient() (client.Client, error) {
	// read the serviceaccount deployer token first.
	token, err := os.ReadFile("/var/run/secrets/kubernetes.io/serviceaccount/token")
	if err != nil {
		// read the legacy deployer token if for some reason the serviceaccount is not found.
		token, err = os.ReadFile("/var/run/secrets/lagoon/deployer/token")
		if err != nil {
			return nil, fmt.Errorf("task failed to find kubernetes token to use, error was: %v", err)
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
	return client.New(config, client.Options{})
}

// We need to annotate the pod with lagoon.sh/taskData + return the job data for the actions-handler
func AddAnnotation(c client.Client, podName, podNamespace string, cloneId int, status string) error {
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
