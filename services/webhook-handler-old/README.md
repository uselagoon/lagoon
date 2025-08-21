<p align="center"><img
src="https://raw.githubusercontent.com/uselagoon/lagoon/main/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Webhook Handler (`webhook-handler`)

The main Lagoon entrypoint for webhooks originating from other services. Every
incoming webhook is parsed and validated before being queued for processing
later.

Examples of webhooks Lagoon is interested in: GitHub/Gitea/Bitbucket/GitLab repository
activity, Lagoon project environment backup events.

## Technology

* Node.js
* Message Queue

## Related Services

* API [***dependency***]
* RabbitMQ [***dependency***]
* webhooks2tasks [***related***]

## Message Queues

* Produces: `lagoon-webhooks`

## Testing

There is test data available from Postman. In order to use it, download
[Postman] and import the `lagoon-webhook-handler.postman_collection.json` as
collection, plus the `localhost.postman_environment.json` as environment. Now
you can send single requests to the webhook handler.

You can also run all tests from the CLI via newman

        yarn run newman:all

[documentation]: https://docs.lagoon.sh/
[Postman]: https://www.getpostman.com/
