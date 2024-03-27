package dioscuri

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/matryer/try"
	networkv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/types"
	client "sigs.k8s.io/controller-runtime/pkg/client"
)

func getIngressWithLabel(ctx context.Context, c client.Client,
	namespace string,
) (*networkv1.IngressList, error) {
	// collect any ingress with legacy dioscuri labels to update them
	dioscuriIngress := networkv1.IngressList{}
	listOption := (&client.ListOptions{}).ApplyOptions([]client.ListOption{
		client.InNamespace(namespace),
		client.MatchingLabels(map[string]string{"dioscuri.amazee.io/migrate": "true"}),
	})
	if err := c.List(context.TODO(), &dioscuriIngress, listOption); err != nil {
		return nil, fmt.Errorf("unable to get any ingress: %v", err)
	}
	for _, i := range dioscuriIngress.Items {
		// remove the old label if it exists
		if err := patchIngress(ctx,
			c,
			&i,
			map[string]interface{}{"dioscuri.amazee.io/migrate": nil, "activestandby.lagoon.sh/migrate": "true"},
		); err != nil {
			return nil, fmt.Errorf("unable to patch ingress with updated label: %v", err)
		}
	}
	// collect ingress ingress with new lagoon.sh labels
	ingress := networkv1.IngressList{}
	listOption = (&client.ListOptions{}).ApplyOptions([]client.ListOption{
		client.InNamespace(namespace),
		client.MatchingLabels(map[string]string{"activestandby.lagoon.sh/migrate": "true"}),
	})
	if err := c.List(context.TODO(), &ingress, listOption); err != nil {
		return nil, fmt.Errorf("unable to get any ingress: %v", err)
	}
	return &ingress, nil
}

func individualIngressMigration(ctx context.Context,
	c client.Client,
	ingress *networkv1.Ingress,
	sourceNamespace string,
	destinationNamespace string,
) (*networkv1.Ingress, error) {
	oldIngress := &networkv1.Ingress{}
	newIngress := &networkv1.Ingress{}
	err := c.Get(context.TODO(), types.NamespacedName{Namespace: sourceNamespace, Name: ingress.ObjectMeta.Name}, oldIngress)
	if err != nil {
		return newIngress, fmt.Errorf("ingress %s in namespace %s doesn't exist: %v", ingress.ObjectMeta.Name, sourceNamespace, err)
	}
	ingressSecrets := copySecrets(ctx, c, oldIngress)
	if err := createSecrets(ctx, c, destinationNamespace, ingressSecrets); err != nil {
		return newIngress, fmt.Errorf("unable to create secrets in destination namespace, error was: %v", err)
	}
	ingressCerts := copyCertificates(ctx, c, oldIngress)
	if err := createCertificates(ctx, c, destinationNamespace, ingressCerts); err != nil {
		return newIngress, fmt.Errorf("unable to create secrets in destination namespace, error was: %v", err)
	}
	// if we ever need to do anything for any ingress with `tls-acme: true` enabled on them, for now, info only
	// if oldIngress.Annotations["kubernetes.io/tls-acme"] == "true" {
	// 	fmt.Printf("Lets Encrypt is enabled for %s", oldIngress.Spec.Host))
	// }
	// actually migrate here
	// we need to create a new ingress now, but we need to swap the namespace to the destination.
	// deepcopyinto from old to the new ingress
	oldIngress.DeepCopyInto(newIngress)
	// set the newingress namespace as the destination namespace
	newIngress.ObjectMeta.Namespace = destinationNamespace
	newIngress.ObjectMeta.ResourceVersion = ""
	// fmt.Printf("Attempting to migrate ingress %s - %s", newIngress.ObjectMeta.Name, newIngress.Spec.Host))
	if err := migrateIngress(ctx, c, newIngress, oldIngress); err != nil {
		return newIngress, fmt.Errorf("error migrating ingress %s in namespace %s: %v", ingress.ObjectMeta.Name, sourceNamespace, err)
	}
	fmt.Printf("> Done migrating ingress %s\n", ingress.ObjectMeta.Name)
	return newIngress, nil
}

// add ingress, and then remove the old one only if we successfully create the new one
func migrateIngress(ctx context.Context,
	c client.Client,
	newIngress *networkv1.Ingress,
	oldIngress *networkv1.Ingress,
) error {
	// delete old ingress from the old namespace
	fmt.Printf("> Removing old ingress %s in namespace %s\n", oldIngress.ObjectMeta.Name, oldIngress.ObjectMeta.Namespace)
	if err := removeIngress(ctx, c, oldIngress); err != nil {
		return err
	}
	// add ingress
	if err := addIngressIfNotExist(ctx, c, newIngress); err != nil {
		return fmt.Errorf("unable to create ingress %s in %s: %v", newIngress.ObjectMeta.Name, newIngress.ObjectMeta.Namespace, err)
	}
	return nil
}

// add any ingress if they don't already exist in the new namespace
func addIngressIfNotExist(ctx context.Context, c client.Client, ingress *networkv1.Ingress) error {
	// add ingress
	// fmt.Printf(">> Getting existing ingress %s in namespace %s", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace))
	err := c.Get(ctx, types.NamespacedName{Namespace: ingress.ObjectMeta.Namespace, Name: ingress.ObjectMeta.Name}, ingress)
	if err != nil {
		// there is no ingress in the destination namespace, then we create it
		fmt.Printf(">> Creating ingress %s in namespace %s\n", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace)
		if err := c.Create(ctx, ingress); err != nil {
			return fmt.Errorf("unable to create ingress %s in %s: %v", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace, err)
		}
	}
	return nil
}

func updateIngress(ctx context.Context, c client.Client, newIngress *networkv1.Ingress, oldIngressNamespace string, labels map[string]interface{}) error {
	// check a few times to make sure the old ingress no longer exists
	for i := 0; i < 10; i++ {
		oldIngressExists := checkOldIngressExists(c, newIngress, oldIngressNamespace)
		if !oldIngressExists {
			// the new ingress with label to ensure ingresscontroller picks it up after we do the deletion
			mergePatch, err := json.Marshal(map[string]interface{}{
				"metadata": map[string]interface{}{
					"labels": labels,
				},
			})
			if err != nil {
				return fmt.Errorf("unable to create mergepatch for %s, error was: %v", newIngress.ObjectMeta.Name, err)
			}
			certificates, secrets := deleteOldSecrets(ctx, c, oldIngressNamespace, newIngress)
			if len(certificates) > 0 {
				// there was an issue with some of the secrets remaining in the source namespace
				fmt.Println(">> The following certificates remained in the namespace:")
				for c, b := range certificates {
					if !b {
						fmt.Printf(">>> %s\n", c)
					}
				}
			}
			if len(secrets) > 0 {
				fmt.Println(">> The following secrets remained in the namespace:")
				for c, b := range secrets {
					if !b {
						fmt.Printf(">>> %s\n", c)
					}
				}
			}
			fmt.Printf(">> Patching ingress %s in namespace %s\n", newIngress.ObjectMeta.Name, newIngress.ObjectMeta.Namespace)
			if err := c.Patch(ctx, newIngress, client.RawPatch(types.MergePatchType, mergePatch)); err != nil {
				return fmt.Errorf("unable to patch ingress %s, error was: %v", newIngress.ObjectMeta.Name, err)
			}
			return nil
		}
		// wait 5 secs before re-trying
		checkInterval := time.Duration(5)
		time.Sleep(checkInterval * time.Second)
	}
	return fmt.Errorf("there was an error checking if the old ingress still exists before trying to patch the new ingress, there may be an issue with the ingress")
}

func checkOldIngressExists(c client.Client, ingress *networkv1.Ingress, sourceNamespace string) bool {
	// fmt.Printf(">> Checking ingress %s is not in source namespace %s", ingress.ObjectMeta.Name, sourceNamespace))
	getIngress := &networkv1.Ingress{}
	err := c.Get(context.TODO(), types.NamespacedName{Namespace: sourceNamespace, Name: ingress.ObjectMeta.Name}, getIngress)
	if err != nil {
		// there is no ingress in the source namespace
		fmt.Printf(">> Ingress %s is not in source namespace %s\n", ingress.ObjectMeta.Name, sourceNamespace)
		return false
	}
	// fmt.Printf(">> Ingress %s is in source namespace %s", ingress.ObjectMeta.Name, sourceNamespace))
	return true
}

// remove a given ingress
func removeIngress(ctx context.Context, c client.Client, ingress *networkv1.Ingress) error {
	// remove ingress
	if err := c.Delete(ctx, ingress); err != nil {
		return fmt.Errorf("unable to delete ingress %s in %s: %v", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace, err)
	}
	// check that the ingress is actually deleted before continuing
	// fmt.Printf(">> Check ingress %s in %s deleted", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace))
	try.MaxRetries = 60
	err := try.Do(func(attempt int) (bool, error) {
		var ingressErr error
		err := c.Get(ctx, types.NamespacedName{
			Namespace: ingress.ObjectMeta.Namespace,
			Name:      ingress.ObjectMeta.Name,
		}, ingress)
		if err != nil {
			// the ingress doesn't exist anymore, so exit the retry
			ingressErr = nil
			fmt.Printf(">> Ingress %s in %s deleted\n", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace)
		} else {
			// if the ingress still exists wait 5 seconds before trying again
			msg := fmt.Sprintf(">> Ingress %s in %s still exists", ingress.ObjectMeta.Name, ingress.ObjectMeta.Namespace)
			ingressErr = fmt.Errorf("%s: %v", msg, err)
			fmt.Println(msg)
		}
		time.Sleep(1 * time.Second)
		return attempt < 60, ingressErr
	})
	if err != nil {
		// if the ingress still exists, return the error
		return err
	}
	return nil
}

func patchIngress(ctx context.Context, c client.Client, ingress *networkv1.Ingress, labels map[string]interface{}) error {
	mergePatch, err := json.Marshal(map[string]interface{}{
		"metadata": map[string]interface{}{
			"labels": labels,
		},
	})
	if err != nil {
		return fmt.Errorf("unable to create mergepatch for %s, error was: %v", ingress.ObjectMeta.Name, err)
	}
	if err := c.Patch(ctx, ingress, client.RawPatch(types.MergePatchType, mergePatch)); err != nil {
		return fmt.Errorf("unable to patch ingress %s, error was: %v", ingress.ObjectMeta.Name, err)
	}
	return nil
}
