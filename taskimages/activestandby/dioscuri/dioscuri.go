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
	fmt.Printf("> Running migration checks for ingress in %s moving to %s\n", rData.SourceNamespace, rData.DestinationNamespace)

	// check destination namespace exists
	namespace := corev1.Namespace{}
	if err := c.Get(ctx,
		types.NamespacedName{
			Name: rData.DestinationNamespace,
		},
		&namespace,
	); err != nil {
		return fmt.Errorf(`========================================
task failed to check destination namespace, error was: %v
========================================
this means the task has not performed any migrations yet and failed during pre-flight checks.
the task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
provide a copy of this entire log to the team`, err)
	}

	// START CHECKING SERVICES SECTION
	// get the ingress from the source namespace, these will get moved to the destination namespace
	migrateDestinationToSource, migrateSourceToDestination, err := collectandCheckIngress(ctx, c, rData)
	if err != nil {
		return fmt.Errorf(`========================================
%v
========================================
this means the task has not performed any migrations yet and failed during pre-flight checks.
the task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
provide a copy of this entire log to the team`, err)
	}

	// START MIGRATING ROUTES PREFLIGHT SECTION

	var migratedIngress []MigratedIngress
	// label the ingress before they're migrated, this is to ensure that the label exists before anything is moved
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
task failed to patch ingress %s, error was: %v
========================================
the active standby switch failed to patch the ingress before the migration took place.
This means the task has not performed any migrations yet and failed during pre-flight checks.
the task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
provide a copy of this entire log to the team`, ingress.ObjectMeta.Name, err)
		}
	}
	for _, ingress := range migrateSourceToDestination.Items {
		// before we move anything we need to modify some annotations/labels
		// with the provided values
		if err := patchIngress(ctx,
			c,
			&ingress,
			map[string]interface{}{"activestandby.lagoon.sh/migrating": "true"},
		); err != nil {
			return fmt.Errorf(`========================================
task failed to patch ingress %s, error was: %v
========================================
the active standby switch failed to patch the ingress before the migration took place.
This means the task has not performed any migrations yet and failed during pre-flight checks.
the task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
provide a copy of this entire log to the team`, ingress.ObjectMeta.Name, err)
		}
	}

	fmt.Printf("> Running ingress migrations validation checks for %s moving to %s\n", rData.SourceNamespace, rData.DestinationNamespace)
	// collect the ingress again after they are labeled
	migrateDestinationToSource, migrateSourceToDestination, err = collectandCheckIngress(ctx, c, rData)
	if err != nil {
		return err
	}
	// validate that the migrating label is added to the ingress
	err = validateMigratingLabel(migrateSourceToDestination, migrateDestinationToSource, true)
	if err != nil {
		return fmt.Errorf(`========================================
%v
========================================
this means the task has not performed any migrations yet and failed during pre-flight checks.
the task may be performed again, but successive failures of this type should be reported to your Lagoon administrator.
provide a copy of this entire log to the team`, err)
	}

	// wait a sec before migrating the ingress after validating the ingress
	checkInterval := time.Duration(10)
	time.Sleep(checkInterval * time.Second)

	fmt.Printf("> Running ingress migrations in %s moving to %s\n", rData.SourceNamespace, rData.DestinationNamespace)
	// START MIGRATING ROUTES SECTION
	// actually start the migrations here
	for _, ingress := range migrateSourceToDestination.Items {
		// migrate these ingress from the source environment, to the destination environment
		// this process deletes the ingress, then re-creates it in the destination environment
		newIngress, err := individualIngressMigration(ctx,
			c,
			&ingress,
			rData.SourceNamespace,
			rData.DestinationNamespace,
		)
		if err != nil {
			return fmt.Errorf(`========================================
task failed to migrate ingress %s, error was: %v
========================================
the active standby switch failed to migrate and ingress in the source namespace to the destination namespace

DO NOT PERFORM THIS TASK AGAIN

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, ingress.ObjectMeta.Name, err)
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
		// migrate these ingress from the destination environment, to the source environment
		// this process deletes the ingress, then re-creates it in the source environment
		newIngress, err := individualIngressMigration(ctx,
			c,
			&ingress,
			rData.DestinationNamespace,
			rData.SourceNamespace,
		)
		if err != nil {
			return fmt.Errorf(`========================================
task failed to migrate ingress %s, error was: %v
========================================
the active standby switch failed to migrate and ingress in the destination namespace to the source namespace

DO NOT PERFORM THIS TASK AGAIN

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, ingress.ObjectMeta.Name, err)
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
task failed to update ingress, error was: %v
========================================
the active standby switch failed to update one or more ingress after the migration took place,
this means that the task likely completed successfully, but the updates may not appear in Lagoon.

DO NOT PERFORM THIS TASK AGAIN

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, err)
		}
	}

	fmt.Printf("> Running post ingress migrations validation checks for %s moving to %s\n", rData.SourceNamespace, rData.DestinationNamespace)
	migrateDestinationToSource, migrateSourceToDestination, err = collectandCheckIngress(ctx, c, rData)
	if err != nil {
		return fmt.Errorf(`========================================
%v
========================================
the active standby switch failed to check an ingress after the migration took place,
this means that the task likely completed successfully, but there was an error verifying the post migration status.

DO NOT PERFORM THIS TASK AGAIN

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, err)
	}
	// validate that the migrating label is added to the ingress
	err = validateMigratingLabel(migrateSourceToDestination, migrateDestinationToSource, false)
	if err != nil {
		return fmt.Errorf(`========================================
%v
========================================
the active standby switch failed to validate an ingress after the migration took place,
this means that the task likely completed successfully, but there was an error verifying the post migration status.

DO NOT PERFORM THIS TASK AGAIN

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, err)
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
task failed to get the pod to update, error was: %v
========================================
the active standby switch completed, but Lagoon has not been updated to reflect the changes.

DO NOT PERFORM THIS TASK AGAIN UNTIL LAGOON REFLECTS THE CHANGES REQUIRED

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, err)
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
task failed to update pod with return information, error was: %v
========================================
the active standby switch completed, but Lagoon has not been updated to reflect the changes.

DO NOT PERFORM THIS TASK AGAIN UNTIL LAGOON REFLECTS THE CHANGES REQUIRED

please contact your Lagoon administrator to make sure your project gets updated correctly.
provide a copy of this entire log to the team`, err)
	}
	return nil
}

func checkKubernetesServices(ctx context.Context,
	c client.Client,
	ingressList *networkv1.IngressList,
	destinationNamespace string,
) (*networkv1.IngressList, error) {
	// check service for ingress exists in destination namespace
	ingressToMigrate := &networkv1.IngressList{}
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
						return nil, fmt.Errorf("service %s for ingress %s doesn't exist in namespace %s, skipping ingress",
							path.Backend.Service.Name, host.Host, destinationNamespace)
					}
					return nil, fmt.Errorf("error getting service, error was: %v", err)
				}
				ingressToMigrate.Items = append(ingressToMigrate.Items, ingress)
			}
		}
	}
	return ingressToMigrate, nil
}
