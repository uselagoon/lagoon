package dioscuri

import (
	"context"
	"fmt"

	certv1 "github.com/cert-manager/cert-manager/pkg/apis/certmanager/v1"
	networkv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/types"
	client "sigs.k8s.io/controller-runtime/pkg/client"
)

// copy any certificate into a slice of certificates
func copyCertificates(ctx context.Context, c client.Client, ingress *networkv1.Ingress) []*certv1.Certificate {
	var certificates []*certv1.Certificate
	for _, tls := range ingress.Spec.TLS {
		certificate := &certv1.Certificate{}
		err := c.Get(ctx, types.NamespacedName{Namespace: ingress.ObjectMeta.Namespace, Name: tls.SecretName}, certificate)
		if err != nil {
			break
		}
		certificates = append(certificates, certificate)
		fmt.Printf(">> Copying certificate %s in namespace %s\n", certificate.ObjectMeta.Name, certificate.ObjectMeta.Namespace)
	}
	return certificates
}

// create any certificates in the destination namespace
func createCertificates(ctx context.Context, c client.Client, destinationNamespace string, certificates []*certv1.Certificate) error {
	for _, certificate := range certificates {
		certificate.ObjectMeta.Namespace = destinationNamespace
		certificate.ResourceVersion = ""
		certificate.UID = ""
		err := c.Create(ctx, certificate)
		if err != nil {
			break
		}
		// secrets = append(secrets, certificate)
		fmt.Printf(">> Creating certificate %s in namespace %s\n", certificate.ObjectMeta.Name, certificate.ObjectMeta.Namespace)
	}
	return nil
}
