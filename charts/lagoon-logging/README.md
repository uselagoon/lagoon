# Lagoon Logging Helm Chart

This chart installs a logging system that will send logs to elasticsearch.

Logs are collated into a single index per lagoon project.

## Requirements

- Helm 3.2.1 or newer

## How to install

Run these commands in the `charts/` directory (above `lagoon-logging/`).

0. Obtain dependency.

```
helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com
helm dependency build lagoon-logging
```

1. Create a `lagoon-logging.values.yaml` file inside `charts/` directory containing these fields with the relevant values added.
   For required values and documentation see the comment block at the end of the chart's `values.yaml`.

```
elasticsearchHost: ...
elasticsearchAdminPassword: ...
clusterName: ...
```

2. Test installation.

```
helm template --debug --namespace lagoon-logging -f ./lagoon-logging.values.yaml lagoon-logging lagoon-logging
```

```
helm upgrade --dry-run --install --debug --create-namespace --namespace lagoon-logging -f ./lagoon-logging.values.yaml lagoon-logging lagoon-logging
```

3. Run installation.

```
helm upgrade --install --debug --create-namespace --namespace lagoon-logging -f ./lagoon-logging.values.yaml lagoon-logging lagoon-logging
```

## View logs

### For namespaces without a lagoon.sh/project label

Logs will appear in indices matching these patterns:

```
container-logs-*_$CLUSTERNAME-*
router-logs-*_$CLUSTERNAME-*
```

e.g. if `clusterName: test1`

```
container-logs-*_test1-*
router-logs-*_test1-*
```

### For namespaces with a lagoon.sh/project label

Logs will appear in indices matching these patterns:

```
container-logs-$PROJECT-*
router-logs-$PROJECT-*
```

e.g. if `lagoon.sh/project: drupal-example`

```
container-logs-drupal-example-*
router-logs-drupal-example-*
```

## How to upgrade

NOTE: If the `logging-operator` chart upgrade doesn't work, just uninstall the helm release and install it again. Logs won't be lost since fluentbit will send the contents of the log files once it is reinstalled.

```
helm upgrade --debug --namespace lagoon-logging --reuse-values lagoon-logging lagoon-logging
```
