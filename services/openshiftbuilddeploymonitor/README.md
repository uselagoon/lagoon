<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# OpenShift Build & Deploy Monitor (`openshiftbuilddeploymonitor`)

Monitors the builds running in OpenShift and updates the Lagoon deployment with
the build status and log messages via the API. OpenShift builds are monitored
until they complete, fail, or the monitor task times out.

Some errors that can occur during the monitoring are tolerable and/or expected
in which case the request will be requeued and retried after some delay.

## Technology

* Node
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* openshiftbuilddeploy [***related***]

## Message Queues

* Consumes: `lagoon-tasks-monitor:builddeploy-openshift`
* Produces: `lagoon-tasks-monitor-delay`

[documentation]: https://lagoon.readthedocs.io/
