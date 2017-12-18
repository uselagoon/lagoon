# Metrics Dashboards

---

This document describes the Grafana dashboards that have been setup as part of the Metrics solution.


[PromQL](https://prometheus.io/docs/prometheus/1.8/querying/basics/), the Prometheus query language, is used by the dashboard widgets to query the Prometheus stored metrics.

Currently Grafana [alert rules](http://docs.grafana.org/alerting/rules/) are only supported by the graph panel.  This will be added to by the Singlestat and Table panels in a future release.

**Notes**

* Due to a bug in Grafana the dashboards are currently displayed twice in the dashboard selection drop-down list.

---


## Dashboards

Each dashboard is stored as a JSON file inside the `dashboards/in-use/` directory.  The contents of these files are then loaded into a Kubernetes `ConfigMap` so that the dashboards are automatically available in Grafana.  The `ConfigMap` is populated from the `serverDashboardFiles` key in the `charts-values/grafana/values.yaml` configuration file.


### Alerts

`alerts.json`

Alerts dashboard.

Available alerts.

* Cluster memory used.


### Kubernetes Capacity Planning

`kubernetes-capacity-planning.json`

Aggregated cluster wide metrics for both the nodes and the Kubernetes system.

Available metrics.

* Idle CPU
* System Load
* Memory Usage
* Disk I/O
* Disk Space Usage
* Network Received
* Network Transmitted
* Cluster Pod Utilization



### Kubernetes Control Plane Status

`kubernetes-control-plane-status.json`

Cluster health of API servers and nodes.

Available metrics.

* Percentage of API servers that are up.
* Percentage of Nodes that are up.
* List of nodes that are up.


### Kubernetes Deployments

`kubernetes-deployments.json`

Aggregated metrics of Kubernetes `Deployments`.

Available metrics.

* CPU Millicores
* Memory
* Network
* Desired Replicas
* Available Replicas
* Observed Generation (how many times deployed)
* Metadata Generation
* Replicas


### Kubernetes Pods

`kubernetes-pods.json`

Detailed metrics for each Kubernetes `Pod`.

Available metrics.

* Pod Status
* IP
* Ready
* Scheduled
* Average CPU
* Current Memory
* Average Network
* Average Disk I/O
* Pod NW Transmit
* Pod NW Receive
* Number of Containers Running
* Number of Container Restarts
* Number of Containers Ready
* Number of Containers Terminated
* Number of Containers Waiting
* Container Memory Usage
* Container CPU Usage Seconds
* Container Disk Write
* Container Disk Read


### Kubernetes Resource Requests

`kubernetes-resource-requests.json`

Available and requested CPU and Memory for Kubernetes workloads.

* CPU Cores Available
* CPU Cores Requested
* Memory Available
* Memory Requested


### Kubernetes StatefulSets

`kubernetes-statefulsets.json`

Similar to the Deployments dashboard but this time for `StatefulSets`.

* CPU Millicores
* Memory
* Network
* Desired Replicas
* Available Replicas
* Observed Generation (how many times deployed)
* Metadata Generation
* Replicas


### Nodes

`nodes.json`

General metrics for each node.

* Idle CPU
* System Load
* Memory Usage
* Disk I/O
* Disk Space Usage
* Network Received
* Network Transmitted


### System

`system.json`

Detailed metrics for each node.

* System Uptime
* Virtual CPUs
* RAM Available (actual)
* Memory Available (percentage)
* Disk Space Usage
* CPU Usage
* Load Average
* Memory
* Memory Distribution
* Forks
* Processes
* Context Switches
* Interrupts
* Network Traffic
* Network Utilization Hourly
* Swap
* Swap Activity
* I/O Activity



## Development

### Workflow

A workflow for further development of the current dashboards is as follows:

* Inside Grafana, create a copy of the dashboard to be developed.
* Make modifications.
* When happy, export the dashboard to JSON and overwrite the current version of the dashboard in the `dashboards/in-use/` directory.
* Test by replacing the current `ConfigMap` of Grafana dashboards with a new `ConfigMap` generated from the files that are stored in the `dashboards/in-use/` directory.  The instructions for how to do this are below in *Generate ConfigMap*.  Check inside Grafana that everything works as expected.
* Copy the contents of the `data` key in the new `ConfigMap` into the `serverDashboardFiles` key in `charts-values/grafana/values.yaml`. The instructions for how to do this are below in *Update Chart Values*.
* Redeploy Grafana and test that everything works as expected.
* Delete the copy of the dashboard that was used for development.


### Generate ConfigMap

Once you have saved an updated dashboard as a JSON file in the `dashboards/in-use/` directory you can redeploy the dashboard `ConfigMap`.

First, delete the current `ConfigMap`.

```console
$ oc delete configmap grafana-dpc-grafana-dashs -n metrics
```

Then generate a new `ConfigMap`, using the files in the `dashboards/in-use/` directory as the source.

```console
$ oc create configmap grafana-dpc-grafana-dashs \
  --from-file dashboards/in-use/ -o json --dry-run -n metrics \
  | sed 's/${DS_PROMETHEUS}/prometheus/g' | k create -n metrics -f -
```


### Update Chart Values

Once you are satisfied that the JSON files in the `dashboards/in-use/` directory are correct you can update the Grafana Helm Chart `values.yaml` file.

Create a new `ConfigMap` to be the source of the changes.

```console
$ k create configmap grafana-dpc-grafana-dashs \
  --from-file dashboards/in-use/ -o yaml --dry-run \
  | sed 's/${DS_PROMETHEUS}/prometheus/g' > ~/dashboards-configmap.yaml
```

Now copy the contents of the `data` key, i.e.

```console
...
...
data:
  alerts.json:|-      <- copy
    {                 <- copy
      "__inputs": [   <- copy
...
...
```

Edit the `charts-values/grafana/values.yaml` file and replace the contents of the `serverDashboardFiles` key with the content copied from the previous step, i.e.

```console
...
...
serverDashboardFiles:
  alerts.json: |-      <- replace
    {                  <- replace
      "__inputs": [    <- replace
...
...
```






