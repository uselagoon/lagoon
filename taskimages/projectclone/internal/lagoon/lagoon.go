package lagoon

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	dockerComposeYamlCMName = "docker-compose-yaml" // the configMap we read the docker-compose.yml details from
	dockerComposeYamlCMKey  = "post-deploy"         // key that contains the docker-compose.yml details we're interested in
)

func GetToken() (string, error) {
	cmd := exec.Command("ssh",
		"-p", os.Getenv("LAGOON_CONFIG_TOKEN_PORT"),
		"-o", "StrictHostKeyChecking=no",
		"-o", "UserKnownHostsFile=/dev/null",
		"-i", "/var/run/secrets/lagoon/ssh/ssh-privatekey",
		fmt.Sprintf("lagoon@%s", os.Getenv("LAGOON_CONFIG_TOKEN_HOST")),
		"token",
	)

	var out, errOut bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &errOut

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("ssh token cmd failed: %v, stderr: %s", err, errOut.String())
	}

	token := strings.TrimSpace(out.String())
	if token == "" {
		return "", fmt.Errorf("Empty token from ssh cmd")
	}

	return token, nil
}

func GetDockerCompose(c client.Client, podNamespace string) (string, error) {
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
