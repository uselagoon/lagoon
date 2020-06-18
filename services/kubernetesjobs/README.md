<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Kubernetes Jobs (`kubernetesjobs`)

Runs a Lagoon task for a project environment running in a Kubernetes cluster. It
validates the request, creates a job container in Kubernetes, and then the
Kubernetes Job Monitor service takes over.

Some errors that can occur during the running are tolerable and/or expected in
which case the request will be requeued and retried after some delay.

## Technology

* Node
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* kubernetesjobmonitor [***related***]

## Message Queues

* Consumes: `lagoon-tasks:job-kubernetes`
* Produces: `lagoon-tasks-monitor:job-kubernetes`, `lagoon-tasks-delay`

[documentation]: https://lagoon.readthedocs.io/
