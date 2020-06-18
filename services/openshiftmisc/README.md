<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# OpenShift Miscellaneous (`openshiftmisc`)

Handles miscellaneous requirements of a Lagoon project environment running in an
OpenShift cluster. Currently able to retrieve a backup of an environment, cancel
a running build/deployment of a Lagoon project environment, and migrate a route
from one Lagoon project environment to another (active/standby deployments).

Some errors that can occur during the processing are tolerable and/or expected
in which case the request will be requeued and retried after some delay.

## Technology

* Node
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]

## Message Queues

* Consumes: `lagoon-tasks:misc-openshift`
* Produces: `lagoon-tasks-delay`

[documentation]: https://lagoon.readthedocs.io/
