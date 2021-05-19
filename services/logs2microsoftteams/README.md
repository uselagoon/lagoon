<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/main/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Logs to Microsoft Teams (`logs2microsoftteams`)

Watches all the Lagoon logs and checks for events that should trigger a
Microsoft Teams message. Each log message is tied to a Lagoon project, and
channel configuration for that project is retrieved from the Lagoon API.

Examples of events that might trigger a message: GitHub pull request opened, a
new build for a Lagoon project environment has started, a task was completed.

## Technology

* Node.js
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]

## Message Queues

* Consumes: `lagoon-logs`, `lagoon-logs:microsoftTeams`
* Produces: `lagoon-logs:microsoftTeams`

[documentation]: https://docs.lagoon.sh/
