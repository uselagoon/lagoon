package dioscuri

import (
	"context"
	"fmt"

	certv1 "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	corev1 "k8s.io/api/core/v1"
	networkv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	client "sigs.k8s.io/controller-runtime/pkg/client"
)

func checkSecrets(ctx context.Context,
	c client.Client,
	ingressList *networkv1.IngressList,
	destinationNamespace string,
) error {
	// check service for ingress exists in destination namespace
	for _, ingress := range ingressList.Items {
		for _, hosts := range ingress.Spec.TLS {
			secret := &corev1.Secret{}
			err := c.Get(ctx,
				types.NamespacedName{
					Namespace: destinationNamespace,
					Name:      hosts.SecretName,
				},
				secret,
			)
			if err != nil {
				if apierrors.IsNotFound(err) {
					// fmt.Printf(">> Secret %s for ingress %s doesn't exist in namespace %s", hosts.SecretName, hosts, destinationNamespace))
					return nil
				}
				return fmt.Errorf("error getting secret, error was: %v", err)
			}
			// return fmt.Errorf("Secret %s for ingress %s exists in namespace %s, skipping ingress", hosts.SecretName, hosts, destinationNamespace)
		}
	}
	return nil
}

// copy any secret into a slice of secrets
func copySecrets(ctx context.Context, c client.Client, ingress *networkv1.Ingress) []*corev1.Secret {
	var secrets []*corev1.Secret
	for _, tls := range ingress.Spec.TLS {
		secret := &corev1.Secret{}
		err := c.Get(ctx, types.NamespacedName{Namespace: ingress.ObjectMeta.Namespace, Name: tls.SecretName}, secret)
		if err != nil {
			break
		}
		secrets = append(secrets, secret)
		fmt.Printf(">> Copying secret %s in namespace %s\n", secret.ObjectMeta.Name, secret.ObjectMeta.Namespace)
	}
	return secrets
}

// create secret in destination namespace
func createSecrets(ctx context.Context, c client.Client, destinationNamespace string, secrets []*corev1.Secret) error {
	for _, secret := range secrets {
		secret.ObjectMeta.Namespace = destinationNamespace
		secret.ResourceVersion = ""
		secret.UID = ""
		err := c.Create(ctx, secret)
		if err != nil {
			break
		}
		secrets = append(secrets, secret)
		fmt.Printf(">> Creating secret %s in namespace %s\n", secret.ObjectMeta.Name, secret.ObjectMeta.Namespace)
	}
	return nil
}

func deleteOldSecrets(ctx context.Context, c client.Client, namespace string, ingress *networkv1.Ingress) (map[string]bool, map[string]bool) {
	certificates := make(map[string]bool)
	secrets := make(map[string]bool)
	for _, tls := range ingress.Spec.TLS {
		certificate := &certv1.Certificate{}
		err := c.Get(ctx, types.NamespacedName{Namespace: namespace, Name: tls.SecretName}, certificate)
		if err == nil {
			certificates[tls.SecretName] = false
			if err = c.Delete(ctx, certificate); err != nil {
				fmt.Printf(">> Unable to delete certificate %s in namespace %s; error was: %v\n", certificate.ObjectMeta.Name, certificate.ObjectMeta.Namespace, err)
				continue
			}
			certificates[tls.SecretName] = true
		} // else the secret didn't exist, so nothing to try and delete
		secret := &corev1.Secret{}
		err = c.Get(ctx, types.NamespacedName{Namespace: namespace, Name: tls.SecretName}, secret)
		if err == nil {
			secrets[tls.SecretName] = false
			if err = c.Delete(ctx, secret); err != nil {
				fmt.Printf(">> Unable to patch secret %s in namespace %s; error was: %v\n", secret.ObjectMeta.Name, secret.ObjectMeta.Namespace, err)
				continue
			}
			secrets[tls.SecretName] = true
		} // else the secret didn't exist, so nothing to try and delete
		// fmt.Printf(">> Added delete annotation to secret %s in namespace %s", secret.ObjectMeta.Name, secret.ObjectMeta.Namespace))
	}
	return certificates, secrets
}
