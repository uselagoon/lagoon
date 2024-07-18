<p align="center"><img
src="https://raw.githubusercontent.com/uselagoon/lagoon/main/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Webhook to Tasks (`webhooks2tasks`)

Processes the queue of incoming webhooks and initiates tasks in Lagoon based on
their type. "Tasks" here is generic for any action, not a Lagoon project
environment task (as seen in the UI).

Examples of tasks: trigger a new build, record a new backup.

## Technology

* Node.js
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* webhook-handler [***related***]

## Message Queues

* Consumes: `lagoon-webhooks`, `lagoon-webhooks:queue`
* Produces: `lagoon-webhooks-delay`

[documentation]: https://docs.lagoon.sh/
