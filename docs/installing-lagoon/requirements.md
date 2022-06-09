# Installing Lagoon Into Existing Kubernetes Cluster

## Requirements

* Kubernetes 1.22+ (Kubernetes 1.19 is supported, but 1.22 is recommended)
* Familiarity with [Helm](https://helm.sh) and [Helm Charts](https://helm.sh/docs/topics/charts/#helm), and [kubectl](https://kubernetes.io/docs/tasks/tools/).
* Ingress controller, we recommend [ingress-nginx](https://github.com/kubernetes/ingress-nginx), installed into ingress-nginx namespace
* Cert manager (for TLS) - We highly recommend using letsencrypt
* StorageClasses (RWO as default, RWM for persistent types)

!!! Note "Note:"
    We acknowledge that this is a lot of steps, and our roadmap for the immediate future includes reducing the number of steps in this process.

## Specific requirements (as of March 2022)

### Kubernetes
Lagoon supports Kubernetes versions 1.19 onwards. We actively test and develop against Kubernetes 1.23, also regularly testing against 1.21,1.22 and 1.24. The next round of breaking changes is in [Kubernetes 1.25](https://kubernetes.io/docs/reference/using-api/deprecation-guide/#v1-25), and we will endeavour to be across these in advance.

### ingress-nginx
Lagoon is currently configured only for a single ingress-nginx controller, and therefore defining an IngressClass has not been necessary.

In order to use the recent ingress-nginx controllers (v4 onwards, required for Kubernetes 1.22), the following configuration should be used, as per [the ingress-nginx docs](https://kubernetes.github.io/ingress-nginx/#what-is-an-ingressclass-and-why-is-it-important-for-users-of-ingress-nginx-controller-now).

- nginx-ingress should be configured as the default controller - set `.controller.ingressClassResource.default: true` in Helm values
- nginx-ingress should be configured to watch ingresses without IngressClass set - set `.controller.watchIngressWithoutClass: true` in Helm values

This will configure the controller to create any new ingresses with itself as the IngressClass, and also to handle any existing ingresses without an IngressClass set.

Other configurations may be possible, but have not been tested.

### Harbor
Versions 2.1 and 2.2+ of Harbor are currently supported - the method of retrieving robot accounts was changed in 2.2, and the Lagoon remote-controller is able to handle these tokens. This means that Harbor has to be configured with the credentials in lagoon-build-deploy - not lagoon-core.

We recommend installing a Harbor version greater than [2.5.0](https://github.com/goharbor/harbor/releases/tag/v2.5.0) with Helm chart [1.9.0](https://github.com/goharbor/harbor-helm/releases/tag/v1.9.0) or greater.

### K8up for backups
Lagoon has built in configuration for the [K8up](https://k8up.io/k8up/1.2/index.html) backup operator. Lagoon can configure prebackup pods, schedules and retentions, and manage backups and restores for K8up. Lagoon currently only supports the 1.x versions of K8up, owing to a namespace change in v2 onwards, but we are working on a fix.

We recommend installing K8up version [1.2.0](https://github.com/k8up-io/k8up/releases/tag/v1.2.0) with helm chart [1.1.0](https://github.com/appuio/charts/releases/tag/k8up-1.1.0)

### Storage provisioners

Lagoon utilises a default 'standard' StorageClass for most workloads, and the internal provisioner for most Kubernetes platforms will suffice. This should be configured to be dynamic provisioning and expandable where possible.

Lagoon also requires a storageClass called 'bulk' to be available to support persistant pod replicas (across nodes). This storageClass should support ReadWriteMany access mode and should be configured to be dynamic provisioning and expandable where possible. See https://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes for more information.

We have curently only included the instructions for (the now deprecated) [EFS Provisioner](./efs-provisioner.md), but most CSI drivers should also work, as will configurations with an NFS-compatible server and provisioner.

## How much Kubernetes experience/knowledge is required?

Lagoon uses some very involved Kubernetes and Cloud Native concepts, and while full familiarity may not be necessary to install and configure Lagoon, diagnosing issues and contributing may prove difficult without a good level of familiarity.

As an indicator, comfort with the curriculum for the [Certified Kubernetes Administrator](https://www.cncf.io/certification/cka/) would be suggested as a minimum.
