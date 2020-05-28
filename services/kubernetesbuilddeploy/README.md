<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Kubernetes Build & Deploy (`kubernetesbuilddeploy`)

Prepares a build/deployment request for a Lagoon project environment running in
a Kubernetes cluster. It gathers all the data necessary for a Kubernetes build
and deployment, validates the request, prepares the Kubernetes namespace,
prepares a build container, and sends it all to the Kubernetes queue.

Some errors that can occur during the preperation are tolerable and/or expected
in which case the request will be requeued and retried after some delay.

## Technology

* Node
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* kubernetesdeployqueue [***related***]
* kubernetesbuilddeploymonitor [***related***]

## Message Queues

* Consumes: `lagoon-tasks:builddeploy-kubernetes`
* Produces: `lagoon-tasks-monitor:queuedeploy-kubernetes`, `lagoon-tasks-delay`

[documentation]: https://lagoon.readthedocs.io/
