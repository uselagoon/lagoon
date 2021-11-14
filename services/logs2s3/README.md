<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/master/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Logs to S3 (`logs2s3`)

Watches all the Lagoon logs and checks for events that should trigger a push to S3. Each log message is tied to a Lagoon project, environment or task.

This is a requirement for Build and Task logs within Lagoon.

## Technology

* Node.js
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]

## Message Queues

* Consumes: `lagoon-logs`, `lagoon-logs:s3`
* Produces: `lagoon-logs:s3`

[documentation]: https://docs.lagoon.sh/
