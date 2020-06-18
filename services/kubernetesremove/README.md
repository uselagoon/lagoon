<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Kubernetes Remove (`kubernetesremove`)

Deletes the resources for a Lagoon project environment running in a Kubernetes
cluster.

Some errors that can occur during the deletion are tolerable and/or expected in
which case the request will be requeued and retried after some delay.

## Technology

* Node
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]

## Message Queues

* Consumes: `lagoon-tasks:remove-kubernetes`
* Produces: `lagoon-tasks-delay`

[documentation]: https://lagoon.readthedocs.io/
