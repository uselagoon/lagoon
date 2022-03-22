# Installing Lagoon Into Existing Kubernetes Cluster

## Requirements

* Kubernetes 1.19+ (Kubernetes 1.22+ is not yet supported, see https://github.com/uselagoon/lagoon/issues/2816 for progress)
* Familiarity with [Helm](https://helm.sh) and [Helm Charts](https://helm.sh/docs/topics/charts/#helm), and [kubectl](https://kubernetes.io/docs/tasks/tools/).
* Ingress controller (ingress-nginx)
* Cert manager (for TLS) - We highly recommend using letsencrypt
* RWO storage

!!! Note "Note:"
    We acknowledge that this is a lot of steps, and our roadmap for the immediate future includes reducing the number of steps in this process.

## Specific requirements (as of March 2022)

### Kubernetes
Lagoon supports Kubernetes versions 1.19, 1.20 and 1.21. Support for 1.22 is underway, and mostly complete. There are a number of relevant API deprecations in 1.22 that Lagoon utilised across a number of dependencies.

### ingress-nginx
Lagoon is currently only for a single ingress-nginx controller, and therefore defining an IngressClass has not been necessary.

This means that Lagoon currently works best with version 3 of the ingress-nginx helm chart - latest release [3.40.0](https://github.com/kubernetes/ingress-nginx/releases/tag/helm-chart-3.40.0)

In order to use a version of the helm chart (>=4) that supports Ingress v1 (i.e for Kubernetes 1.22), the following configuration should be used,as per [the ingress-nginx docs](https://kubernetes.github.io/ingress-nginx/#what-is-an-ingressclass-and-why-is-it-important-for-users-of-ingress-nginx-controller-now)

- nginx-ingress should be configured as the default controller - set `.controller.ingressClassResource.default: true` in helm values
- nginx-ingress should be configured to watch ingresses without IngressClass set - set `.controller.watchIngressWithoutClass: true` in helm values

This will configure the controller to create any new ingresses with itself as the IngressClass, and also to handle any existing ingresses without an IngressClass set

Other configurations may be possible, but have not been tested

### Harbor
Only Harbor <2.2 is currently supported - the method of retrieving robot accounts was changed in 2.2, and we are working on a fix

This means you should install Harbor [2.1.6](https://github.com/goharbor/harbor/releases/tag/v2.1.6) with helm chart [1.5.6](https://github.com/goharbor/harbor-helm/releases/tag/1.5.6)
