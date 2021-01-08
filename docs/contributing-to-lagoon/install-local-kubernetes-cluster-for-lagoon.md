---
description: >-
  Note that as of Lagoon 1.x, only OpenShift is supported to run Lagoon itself. 
  Kubernetes is only supported to deploy projects and environments into.
---

# Install local Kubernetes cluster for Lagoon

Let's see how to install a local lightweight Kubernetes cluster using k3s by Rancher: [rancher/k3s](https://github.com/rancher/k3s)

{% hint style="info" %}
In order to have the best experience we recommend the following:

* Linux or Mac OSX 
* 32 GB+ RAM total 
* 12 GB+ RAM allocated to Docker 
* 6+ cores allocated to Docker 
* SSD disk with 25GB+ free
{% endhint %}

## Installation Checklist

1. Make sure you have a clean state checking the following \(use `-n` option for dry-run\):
   1. Make sure no lagoon containers are running running `make kill`.
   2. Make sure to clean any old lagoon containers and volumes running `make down`.
   3. Now your `build` dir should be empty and `docker ps` should show no containers running.
2. Make sure to allow `172.17.0.1:5000` as insecure registry, check the [Docker docs](https://docs.docker.com/registry/insecure/) for more information.
   1. Edit `insecure-registries` key in your `/etc/docker/daemon.json` and add `"insecure-registries":["172.17.0.1:5000"]` then restart docker service with `systemctl restart docker`.
3. Using `sysctl vm.max_map_count` , check the value of `vm.max_map_count` is at least `262144` or set it is using `sysctl -w vm.max_map_count=262144`. We need to increase this value to avoid error [`max virtual memory areas is too low`](https://stackoverflow.com/questions/51445846/elasticsearch-max-virtual-memory-areas-vm-max-map-count-65530-is-too-low-inc/51448773#51448773) on `logs-db` Elasticsearch service.

## Create a local k3s cluster

1. Now you can create a local k3s Kubernetes cluster running `make k3d` and see the following notable outputs: \(k3d is a wrapper for running k3s in Docker\)

   ```text
    INFO[0000] Creating cluster [k3s-lagoon]
    INFO[0000] Creating server using docker.io/rancher/k3s:v1.17.0-k3s.1...
    INFO[0008] SUCCESS: created cluster [k3s-lagoon]
    ...
    The push refers to repository [localhost:5000/lagoon/docker-host]
    ...
    The push refers to repository [localhost:5000/lagoon/kubectl-build-deploy-dind]
    ...
    Release "k8up" does not exist. Installing it now.
    NAME: k8up
    LAST DEPLOYED: Thu May  7 10:45:46 2020
    NAMESPACE: k8up
    STATUS: deployed
    REVISION: 1
    TEST SUITE: None
    namespace/dbaas-operator created
    "dbaas-operator" has been added to your repositories
    Release "dbaas-operator" does not exist. Installing it now.
    NAME: dbaas-operator
    LAST DEPLOYED: Thu May  7 10:45:47 2020
    NAMESPACE: dbaas-operator
    STATUS: deployed
    REVISION: 1
    TEST SUITE: None
    Release "mariadbprovider" does not exist. Installing it now.
    coalesce.go:165: warning: skipped value for providers: Not a table.
    NAME: mariadbprovider
    LAST DEPLOYED: Thu May  7 10:45:48 2020
    NAMESPACE: dbaas-operator
    STATUS: deployed
    REVISION: 1
    TEST SUITE: None
    namespace/lagoon created
    Release "lagoon-remote" does not exist. Installing it now.
    NAME: lagoon-remote
    LAST DEPLOYED: Thu May  7 10:45:48 2020
    NAMESPACE: lagoon
    STATUS: deployed
    REVISION: 1
    TEST SUITE: None
   ```

2. At the end of the script, using `docker ps` you should see an output like the following:

   ```text
    CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS              PORTS                                                                     NAMES
    0d61e8ba168e        rancher/k3s:v1.17.0-k3s.1   "/bin/k3s server --h…"   28 minutes ago      Up 28 minutes       0.0.0.0:16643->16643/tcp, 0.0.0.0:18080->80/tcp, 0.0.0.0:18443->443/tcp   k3d-k3s-lagoon-server
    a7960981caaa        lagoon/local-registry       "/entrypoint.sh /etc…"   30 minutes ago      Up 30 minutes       0.0.0.0:5000->5000/tcp                                                    lagoon_local-registry_1
   ```

3. `make k3d-kubeconfig` will print the `KUBECONFIG` env var you need to start using the cluster. 
   1. Execute `export KUBECONFIG="$(./local-dev/k3d get-kubeconfig --name=$(cat k3d))"` inside the terminal.
   2. Now you should be able to use the cluster via an already installed `kubectl` or making a symbolic link to `/usr/local/bin/kubectl -> /your/path/amazee/lagoon/local-dev/kubectl` 
   3. If you prefer to use something more visual you could install [k9s](https://k9scli.io/topics/install/) cli tool.
   4. Here is the complete list of pods you should see with `kubectl get pod -A` :

      ```text
         NAMESPACE        NAME
         kube-system      local-path-provisioner
         kube-system      metrics-server
         k8up             k8up-operator
         dbaas-operator   kube-rbac-proxy,manager
         kube-system      coredns
         lagoon           docker-host
         kube-system      helm
         kube-system      nginx-ingress-default-backend
         kube-system      lb-port-80,lb-port-443
         kube-system      nginx-ingress-controller
      ```

   5. Here is the complete list of deployed Helm [releases](https://helm.sh/docs/helm/helm_list/) you should see with `local-dev/helm/helm ls --all-namespaces`:

      ```text
      NAME             NAMESPACE
      dbaas-operator      dbaas-operator
      k8up                k8up
      lagoon-remote       lagoon
      mariadbprovider     dbaas-operator
      nginx               kube-system
      ```

## Deploy Lagoon on Kubernetes

1. TODO

## Configure Installed Lagoon

We have a fully running Kubernetes cluster. Now it's time to configure the first project inside of it. Follow the examples in [GraphQL API](../administering-lagoon/graphql-queries.md).

## Clean up

Clean up k3s cluster with `make k3d/stop`.

## Troubleshooting

⚠ **Unable to connect to the server: x509: certificate signed by unknown authority**

Rebuild the cluster via:

```text
make k3d/stop
make k3d
```

