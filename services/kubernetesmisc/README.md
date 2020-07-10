<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Kubernetes Miscellaneous (`kubernetesmisc`)

Handles miscellaneous requirements of a Lagoon project environment running in a
Kubernetes cluster. Currently able to retrieve a backup of a Lagoon project
environment and cancel a running build/deployment of a Lagoon project
environment.

Some errors that can occur during the processing are tolerable and/or expected
in which case the request will be requeued and retried after some delay.

## Technology

* Node.js
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]

## Message Queues

* Consumes: `lagoon-tasks:misc-kubernetes`
* Produces: `lagoon-tasks-delay`

[documentation]: https://lagoon.readthedocs.io/
