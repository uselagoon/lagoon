# Metrics Install

---

This document describes how to install the Metrics solution inside an OpenShift cluster.  The Metrics solution uses the [Prometheus](https://prometheus.io) and [Grafana](https://grafana.com) products.

**Notes**

* Ensure that Helm has been installed into the cluster, as per this [guide](helm.md).
* To execute these instructions you must be logged into OpenShift as a cluster administrator
```console
$ oc login -u system:admin
```
---

## Metrics Project

Create a `metrics` project for the workloads to be deployed into.

```console
$ oc new-project metrics
```

Give Helm the ability to deploy to the project.

```console
$ oc policy add-role-to-user edit "system:serviceaccount:${TILLER_NAMESPACE}:tiller"
```


<a name="prometheus"></a>
## Prometheus

There is a [customised](metrics_charts.md#prometheus) version of the standard Prometheus Helm [Chart](https://github.com/kubernetes/charts/tree/master/stable/prometheus) available in the `charts/prometheus-dpc/` directory.

For Helm to be able to deploy the `NodeExporter` `DaemonSet` into an OpenShift cluster, the `tiller` service account needs appropriate permissions.  A shortcut, until the correct permissions are known, is to apply the `cluster-admin` role to the `tiller` service account.

```console
$ oc adm policy add-cluster-role-to-user cluster-admin system:serviceaccount:tiller:tiller
```

**Notes**

* If deploying this to a local MiniShift cluster then you can get the IP addess using `minishift ip`.
* This example uses a local MiniShift cluster IP address for the `server.ingress.hosts[0]` value.


**Install**
```console
# Get the MiniShift IP to use in the FQDN of the route
$ export MINISHIFT_IP=`minishift ip`

$ helm install -n prometheus-dpc --namespace metrics \
  --set rbac.create=true \
  --set openshift=true \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false \
  --set server.ingress.hosts[0]=prometheus-dpc.${MINISHIFT_IP}.nip.io \
  charts/prometheus-dpc/
```

**Upgrade**
```console
# Get the MiniShift IP to use in the FQDN of the route
$ export MINISHIFT_IP=`minishift ip`

$ helm upgrade prometheus-dpc \
  --set rbac.create=true \
  --set openshift=true \
  --set alertmanager.enabled=false \
  --set pushgateway.enabled=false \
  --set server.ingress.hosts[0]=prometheus-dpc.${MINISHIFT_IP}.nip.io \
  charts/prometheus-dpc/
```


The standard permissions within OpenShift do not allow Prometheus to fully work.  As such the following commands must be run.

```console
# Needed so that the host network, ports and PID are available to the Node Exporter.
$ oc adm policy add-scc-to-user privileged \
  system:serviceaccount:metrics:prometheus-dpc-prometheus-dpc-node-exporter

# Needed so that the Prometheus server is able to watch v1.Endpoints, v1.Pod, v1.Service and v1.Node resources
$ oc adm policy add-cluster-role-to-user cluster-admin \
  system:serviceaccount:metrics:prometheus-dpc-prometheus-dpc-server

# Needed so Kube State Metrics can talk to the API server
$ oc adm policy add-cluster-role-to-user cluster-admin \
  system:serviceaccount:metrics:prometheus-dpc-prometheus-dpc-kube-state-metrics
```

If your MiniShift IP address was `192.168.64.3` then you would now be able to access Prometheus using the following URL.<br/>

[http://prometheus-dpc.192.168.64.3.nip.io](http://prometheus-dpc.192.168.64.3.nip.io)


<a name="grafana"></a>
## Grafana

There is a [customised](metrics_charts.md#grafana) version of the standard Grafana Helm [Chart](https://github.com/kubernetes/charts/tree/master/stable/grafana) available in the `charts/grafana-dpc/` directory.

**Notes**

* If deploying this to a local MiniShift cluster then you can get the IP addess using `minishift ip`.
* This example uses a local MiniShift cluster IP address for the `server.ingress.hosts[0]` value.


The standard permissions within OpenShift do not allow Grafana to fully work.  As such the following commands must be run.

```console

# Needed so that the directories mounted into the container are able to have their 
# owner changed.
$ oc adm policy add-scc-to-user anyuid system:serviceaccount:metrics:default

# Possibly not needed?
$ oc adm policy add-scc-to-user privileged system:serviceaccount:metrics:default
```

**Install**
```console
# Get the MiniShift IP to use in the FQDN of the route
$ export MINISHIFT_IP=`minishift ip`

$ helm install -n grafana-dpc --namespace metrics \
  --set openshift=true \
  --set server.ingress.hosts[0]=grafana-dpc.${MINISHIFT_IP}.nip.io \
  -f charts-values/grafana/values.yaml \
  charts/grafana-dpc/
```

**Upgrade**
```console
# Get the MiniShift IP to use in the FQDN of the route
$ export MINISHIFT_IP=`minishift ip`

$ helm upgrade grafana-dpc \
  --set openshift=true \
  --set server.ingress.hosts[0]=grafana-dpc.${MINISHIFT_IP}.nip.io \
  -f charts-values/grafana/values.yaml \
  charts/grafana-dpc/
```

if using Oauth then add the additional argumnents to the preceeding commands.

```console
  --set server.setGenericOauth.clientID=XXXXXXXXXXXX \
  --set server.setGenericOauth.clientSecret=YYYYYYYYYYYY \
```

Where `XXXXXXXXXXXX` and `YYYYYYYYYYYY` are the Oauth Client ID and the Oauth Client Secret respectively, i.e.

```console
$ helm upgrade grafana-dpc \
  --set openshift=true \
  --set server.ingress.hosts[0]=grafana-dpc.${MINISHIFT_IP}.nip.io \
  --set server.setGenericOauth.clientId=bXd7yxVqxsOOSUfGbWv2Gj66YGDD6YSa \
  --set server.setGenericOauth.clientSecret=SnHw1_pA8PBReUPtsPH82H2kFCLebeTUC-CxPyDkD-DuU36wV_gZfxE1jZZsJjk- \
  -f charts-values/grafana/values.yaml \
  charts/grafana-dpc/
```

To get the password for the `admin` user.

```console
$ oc get secret --namespace metrics grafana-dpc-grafana \
  -o jsonpath="{.data.grafana-admin-password}" | base64 --decode ; echo
```

If your MiniShift IP address was `192.168.99.100` then you would now be able to access Prometheus using the following URL.<br/>

[http://grafana-dpc.192.168.99.100.nip.io](http://grafana-dpc.192.168.99.100.nip.io)


**Notifications**

The Grafana Helm Chart creates a Slack notification channel as part of the install.  However, the webhook URL is a dummy value as the proper value is private.  Therefore you must manually add the webhook URL.  To do this navigate to the Notification channels screen `-> Alerting -> Notification channels`.  Then click `edit` on the `salsa_dpc #bay-build` notification channel.  Finally, add the proper URL into the `Url` field and save.

