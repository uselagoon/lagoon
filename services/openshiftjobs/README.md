<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# OpenShift Jobs (`openshiftjobs`)

Runs a Lagoon task for a project environment running in an OpenShift cluster. It
validates the request, creates a job container in OpenShift, and then the
OpenShift Job Monitor service takes over.

Some errors that can occur during the running are tolerable and/or expected in
which case the request will be requeued and retried after some delay.

## Technology

* Node.js
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* openshiftjobmonitor [***related***]

## Message Queues

* Consumes: `lagoon-tasks:job-openshift`
* Produces: `lagoon-tasks-monitor:job-openshift`, `lagoon-tasks-delay`

[documentation]: https://lagoon.readthedocs.io/
