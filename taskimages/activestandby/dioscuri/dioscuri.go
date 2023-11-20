package dioscuri

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	corev1 "k8s.io/api/core/v1"
	networkv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/types"
	client "sigs.k8s.io/controller-runtime/pkg/client"
)

// MigratedIngress .
type MigratedIngress struct {
	NewIngress          *networkv1.Ingress
	OldIngressNamespace string
}

// this is the return data structure for the active standby task.
// this will be sent back to lagoon as a payload to be processed.
type ReturnData struct {
	Status                      string `json:"status"`
	ProductionEnvironment       string `json:"productionEnvironment"`
	StandbyProdutionEnvironment string `json:"standbyProductionEnvironment"`
	ProductionRoutes            string `json:"productionRoutes"`
	StandbyRoutes               string `json:"standbyRoutes"`
	SourceNamespace             string `json:"sourceNamespace"`
	DestinationNamespace        string `json:"DestinationNamespace"`
}

func RunMigration(c client.Client, rData *ReturnData, podName, podNamespace string) error {
	ctx := context.Background()
	var activeMigratedIngress []string
	var standbyMigratedIngress []string
	fmt.Println(fmt.Sprintf("> Running migration checks for ingress in %s moving to %s", rData.SourceNamespace, rData.DestinationNamespace))

	// check destination namespace exists
	namespace := corev1.Namespace{}
	if err := c.Get(ctx,
		types.NamespacedName{
			Name: rData.DestinationNamespace,
		},
		&namespace,
	); err != nil {
		return fmt.Errorf(`========================================
Task failed to check destination namespace, error was: %v
========================================
This means the task has not performed any migrations yet and failed during pre-flight checks.
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}

	// START CHECKING SERVICES SECTION
	// migrateLabels := map[string]string{"activestandby.lagoon.sh/migrate": "true"}
	// get the ingress from the source namespace, these will get moved to the destination namespace
	ingressSourceToDestination := &networkv1.IngressList{}
	ingressSourceToDestination, err := getIngressWithLabel(ctx,
		c,
		rData.SourceNamespace,
	)
	if err != nil {
		return fmt.Errorf(`========================================
Task failed to check ingress in source namespace, error was: %v
========================================
This means the task has not performed any migrations yet and failed during pre-flight checks.
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}
	// get the ingress from the destination namespace, these will get moved to the source namespace
	ingressDestinationToSource, err := getIngressWithLabel(ctx,
		c,
		rData.DestinationNamespace,
	)
	if err != nil {
		return fmt.Errorf(`========================================
Task failed to check ingress in destination namespace, error was: %v
========================================
This means the task has not performed any migrations yet and failed during pre-flight checks.
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}
	// check that the services for the ingress we are moving exist in each namespace
	migrateDestinationToSource := &networkv1.IngressList{}
	if err := checkKubernetesServices(ctx,
		c,
		ingressDestinationToSource,
		migrateDestinationToSource,
		rData.SourceNamespace,
	); err != nil {
		return fmt.Errorf(`========================================
Task failed to check services in source namespace, error was: %v
========================================
This means the task has not performed any migrations yet and failed during pre-flight checks.
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}
	migrateSourceToDestination := &networkv1.IngressList{}
	if err := checkKubernetesServices(ctx,
		c,
		ingressSourceToDestination,
		migrateSourceToDestination,
		rData.DestinationNamespace,
	); err != nil {
		return fmt.Errorf(`========================================
Task failed to check services in destination namespace, error was: %v
========================================
This means the task has not performed any migrations yet and failed during pre-flight checks.
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}
	if err := checkSecrets(ctx,
		c,
		ingressDestinationToSource,
		rData.SourceNamespace,
	); err != nil {
		return fmt.Errorf(`========================================
Task failed to check ingress secrets in source namespace, error was: %v
========================================
This means the task has not performed any migrations yet, and failed during pre-flight checks
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}
	// check that the secrets for the ingress we are moving don't already exist in each namespace
	if err := checkSecrets(ctx,
		c,
		ingressSourceToDestination,
		rData.DestinationNamespace,
	); err != nil {
		return fmt.Errorf(`========================================
Task failed to check ingress secrets in destination namespace, error was: %v
========================================
This means the task has not performed any migrations yet, and failed during pre-flight checks
The task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
Provide a copy of this entire log to the team.`, err)
	}
	// END CHECKING SERVICES SECTION

	// START MIGRATING ROUTES SECTION
	fmt.Println(fmt.Sprintf("> Running ingress migrations in %s moving to %s", rData.SourceNamespace, rData.DestinationNamespace))
	// actually start the migrations here
	var migratedIngress []MigratedIngress
	for _, ingress := range migrateSourceToDestination.Items {
		// before we move anything we need to modify some annotations/labels
		// with the provided values
		if err := patchIngress(ctx,
			c,
			&ingress,
			map[string]interface{}{"activestandby.lagoon.sh/migrating": "true"},
		); err != nil {
			return fmt.Errorf(`========================================
Task failed to patch ingress %s, error was: %v
========================================
The active standby switch failed to patch an ingress before the migration took place.
Depending on where this fails, the environment may have already migrated one or more ingress.

DO NOT PERFORM THIS TASK AGAIN

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, ingress.ObjectMeta.Name, err)
		}

		// migrate these ingress
		newIngress, err := individualIngressMigration(ctx,
			c,
			&ingress,
			rData.SourceNamespace,
			rData.DestinationNamespace,
		)
		if err != nil {
			return fmt.Errorf(`========================================
Task failed to migrate ingress %s, error was: %v
========================================
The active standby switch failed to migrate and ingress in the source namespace to the destination namespace

DO NOT PERFORM THIS TASK AGAIN

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, ingress.ObjectMeta.Name, err)
		}
		migratedIngress = append(migratedIngress,
			MigratedIngress{
				NewIngress:          newIngress,
				OldIngressNamespace: rData.SourceNamespace,
			},
		)
		ingressScheme := "http://"
		if ingress.Spec.TLS != nil {
			ingressScheme = "https://"
		}
		for _, rule := range ingress.Spec.Rules {
			standbyMigratedIngress = append(standbyMigratedIngress, fmt.Sprintf("%s%s", ingressScheme, rule.Host))
		}
	}
	for _, ingress := range migrateDestinationToSource.Items {
		// before we move anything we may need to modify some annotations
		// patch all the annotations we are given in the `pre-migrate-resource-annotations`
		// with the provided values
		if err := patchIngress(ctx,
			c,
			&ingress,
			map[string]interface{}{"activestandby.lagoon.sh/migrating": "true"},
		); err != nil {
			return fmt.Errorf(`========================================
Task failed to patch ingress %s, error was: %v
========================================
The active standby switch failed to patch an ingress before the migration took place.
Depending on where this fails, the environment may have already migrated one or more ingress.

DO NOT PERFORM THIS TASK AGAIN

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, ingress.ObjectMeta.Name, err)
		}
		// migrate these ingress
		newIngress, err := individualIngressMigration(ctx,
			c,
			&ingress,
			rData.DestinationNamespace,
			rData.SourceNamespace,
		)
		if err != nil {
			return fmt.Errorf(`========================================
Task failed to migrate ingress %s, error was: %v
========================================
The active standby switch failed to migrate and ingress in the destination namespace to the source namespace

DO NOT PERFORM THIS TASK AGAIN

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, ingress.ObjectMeta.Name, err)
		}
		// add the migrated ingress so we go through and fix them up later
		migratedIngress = append(migratedIngress,
			MigratedIngress{NewIngress: newIngress,
				OldIngressNamespace: rData.DestinationNamespace,
			},
		)
		ingressScheme := "http://"
		if ingress.Spec.TLS != nil {
			ingressScheme = "https://"
		}
		for _, rule := range ingress.Spec.Rules {
			activeMigratedIngress = append(activeMigratedIngress, fmt.Sprintf("%s%s", ingressScheme, rule.Host))
		}
	}
	// wait a sec before updating the ingress
	checkInterval := time.Duration(1)
	time.Sleep(checkInterval * time.Second)

	// once we move all the ingress, we have to go through and do a final update on them to make sure any `HostAlreadyClaimed` warning/errors go away
	for _, migratedIngress := range migratedIngress {
		// // we may need to move some resources after we move the ingress, we can define their annotations here
		err := updateIngress(ctx,
			c,
			migratedIngress.NewIngress,
			migratedIngress.OldIngressNamespace,
			map[string]interface{}{
				"activestandby.lagoon.sh/migrating":     "false",
				"activestandby.lagoon.sh/migrated-from": migratedIngress.OldIngressNamespace,
			},
		)
		if err != nil {
			return fmt.Errorf(`========================================
Task failed to update ingress, error was: %v
========================================
The active standby switch failed to update one or more ingress after the migration took place,
this means that the task likely completed successfully, but the updates may not appear in Lagoon.

DO NOT PERFORM THIS TASK AGAIN

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, err)
		}
	}

	rData.Status = "Completed"
	rData.ProductionRoutes = strings.Join(activeMigratedIngress, ",")
	rData.StandbyRoutes = strings.Join(standbyMigratedIngress, ",")

	// print the result of the task, it will go back to lagoon-logs to be displayed
	// to the user
	oldProduction := rData.ProductionEnvironment
	oldStandby := rData.StandbyProdutionEnvironment
	rData.ProductionEnvironment = oldStandby
	rData.StandbyProdutionEnvironment = oldProduction
	// oldSource := rData.SourceNamespace
	// oldDestination := rData.DestinationNamespace
	rData.ProductionEnvironment = oldStandby
	rData.StandbyProdutionEnvironment = oldProduction
	jsonData, _ := json.Marshal(rData)
	fmt.Println("========================================")
	fmt.Println("Status:", rData.Status)
	fmt.Println("Active Environment:", rData.ProductionEnvironment)
	fmt.Println("Active Routes:", rData.ProductionRoutes)
	fmt.Println("Standby Environment:", rData.StandbyProdutionEnvironment)
	fmt.Println("Standby Routes:", rData.StandbyRoutes)
	fmt.Println("========================================")
	pod := corev1.Pod{}
	if err := c.Get(context.Background(), types.NamespacedName{
		Namespace: podNamespace,
		Name:      podName,
	}, &pod); err != nil {
		return fmt.Errorf(`========================================
Task failed to get the pod to update, error was: %v
========================================
The active standby switch completed, but Lagoon has not been updated to reflect the changes.

DO NOT PERFORM THIS TASK AGAIN UNTIL LAGOON REFLECTS THE CHANGES REQUIRED

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, err)
	}
	// the job data to send back to lagoon must be base64 encoded
	mergePatch, _ := json.Marshal(map[string]interface{}{
		"metadata": map[string]interface{}{
			"annotations": map[string]interface{}{
				"lagoon.sh/taskData": base64.StdEncoding.EncodeToString(jsonData),
			},
		},
	})
	// update the pod with the annotation
	if err := c.Patch(context.Background(), &pod, client.RawPatch(types.MergePatchType, mergePatch)); err != nil {
		return fmt.Errorf(`========================================
Task failed to update pod with return information, error was: %v
========================================
The active standby switch completed, but Lagoon has not been updated to reflect the changes.

DO NOT PERFORM THIS TASK AGAIN UNTIL LAGOON REFLECTS THE CHANGES REQUIRED

Please contact your Lagoon administrator to make sure your project gets updated correctly.
Provide a copy of this entire log to the team.`, err)
	}
	return nil
}

func checkKubernetesServices(ctx context.Context,
	c client.Client,
	ingressList *networkv1.IngressList,
	ingressToMigrate *networkv1.IngressList,
	destinationNamespace string,
) error {
	// check service for ingress exists in destination namespace
	for _, ingress := range ingressList.Items {
		for _, host := range ingress.Spec.Rules {
			for _, path := range host.HTTP.Paths {
				service := &corev1.Service{}
				err := c.Get(ctx,
					types.NamespacedName{
						Namespace: destinationNamespace,
						Name:      path.Backend.Service.Name,
					},
					service,
				)
				if err != nil {
					if apierrors.IsNotFound(err) {
						return fmt.Errorf("Service %s for ingress %s doesn't exist in namespace %s, skipping ingress",
							path.Backend.Service.Name, host.Host, destinationNamespace)
					}
					return fmt.Errorf("Error getting service, error was: %v", err)
				}
				ingressToMigrate.Items = append(ingressToMigrate.Items, ingress)
			}
		}
	}
	return nil
}
