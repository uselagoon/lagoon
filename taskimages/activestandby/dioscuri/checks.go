package dioscuri

import (
	"context"
	"fmt"
	"strconv"

	networkv1 "k8s.io/api/networking/v1"
	client "sigs.k8s.io/controller-runtime/pkg/client"
)

func collectandCheckIngress(ctx context.Context, c client.Client, rData *ReturnData) (*networkv1.IngressList, *networkv1.IngressList, error) {
	ingressSourceToDestination, err := getIngressWithLabel(ctx,
		c,
		rData.SourceNamespace,
	)
	if err != nil {
		return nil, nil, fmt.Errorf(`task failed to check ingress in source namespace, error was: %v`, err)
	}
	// get the ingress from the destination namespace, these will get moved to the source namespace
	ingressDestinationToSource, err := getIngressWithLabel(ctx,
		c,
		rData.DestinationNamespace,
	)
	if err != nil {
		return nil, nil, fmt.Errorf(`task failed to check ingress in destination namespace, error was: %v`, err)
	}
	// check that the services for the ingress we are moving exist in each namespace
	migrateDestinationToSource, err := checkKubernetesServices(ctx,
		c,
		ingressDestinationToSource,
		rData.SourceNamespace,
	)
	if err != nil {
		return nil, nil, fmt.Errorf(`task failed to check services in source namespace, error was: %v`, err)
	}
	migrateSourceToDestination, err := checkKubernetesServices(ctx,
		c,
		ingressSourceToDestination,
		rData.DestinationNamespace,
	)
	if err != nil {
		return nil, nil, fmt.Errorf(`task failed to check services in destination namespace, error was: %v`, err)
	}
	if err := checkSecrets(ctx,
		c,
		migrateDestinationToSource,
		rData.SourceNamespace,
	); err != nil {
		return nil, nil, fmt.Errorf(`task failed to check ingress secrets in source namespace, error was: %v`, err)
	}
	// check that the secrets for the ingress we are moving don't already exist in each namespace
	if err := checkSecrets(ctx,
		c,
		migrateSourceToDestination,
		rData.DestinationNamespace,
	); err != nil {
		return nil, nil, fmt.Errorf(`task failed to check ingress secrets in destination namespace, error was: %v`, err)
	}
	return migrateDestinationToSource, migrateSourceToDestination, nil
}

func validateMigratingLabel(migrateSourceToDestination, migrateDestinationToSource *networkv1.IngressList, valid bool) error {
	for _, ingress := range migrateSourceToDestination.Items {
		val, ok := ingress.ObjectMeta.Labels["activestandby.lagoon.sh/migrating"]
		if !ok {
			return fmt.Errorf(`task failed due to ingress %s missing the migrating label`, ingress.ObjectMeta.Labels)
		}
		vBool, _ := strconv.ParseBool(val)
		if vBool != valid {
			return fmt.Errorf(`task failed due to ingress %s having the wrong label value for the migration, it should be %t (got %t)`, ingress.ObjectMeta.Name, valid, vBool)
		}
	}
	for _, ingress := range migrateDestinationToSource.Items {
		val, ok := ingress.ObjectMeta.Labels["activestandby.lagoon.sh/migrating"]
		if !ok {
			return fmt.Errorf(`task failed due to ingress %s missing the migrating label`, ingress.ObjectMeta.Name)
		}
		vBool, _ := strconv.ParseBool(val)
		if vBool != valid {
			return fmt.Errorf(`task failed due to ingress %s having the wrong label value for the migration, it should be %t (got %t)`, ingress.ObjectMeta.Name, valid, vBool)
		}
	}
	return nil
}
