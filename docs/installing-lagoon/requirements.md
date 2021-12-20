# Installing Lagoon Into Existing Kubernetes Cluster

## Requirements

* Kubernetes 1.18+
* Familiarity with [Helm](https://helm.sh) and [Helm Charts](https://helm.sh/docs/topics/charts/#helm), and [kubectl](https://kubernetes.io/docs/tasks/tools/).
* Ingress controller, we recommend [ingress-nginx](https://github.com/kubernetes/ingress-nginx), installed into ingress-nginx namespace
* Cert manager (for TLS) - We highly recommend using letsencrypt
* RWO storage

!!! Note "Note:"
    We acknowledge that this is a lot of steps, and our roadmap for the immediate future includes reducing the number of steps in this process.

## How much Kubernetes experience/knowledge is required?

Lagoon uses some very involved Kubernetes and Cloud Native concepts, and whilst full familiarity may not be necessary to install and configure Lagoon, diagnosing issues and contributing may prove difficult without a good level of familiarity.

As an indicator, comfort with the curriculum for the [Certified Kubernetes Administrator](https://www.cncf.io/certification/cka/) would be suggested as a minimum.
