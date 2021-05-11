<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/main/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# API (`api`)

The main GraphQL API for Lagoon. Uses the [Apollo server library](https://www.apollographql.com/docs/apollo-server/v1/).

## Technology

* Node.js
* GraphQL
* Message Queue

## Related Services

* API [***dependency***]
* Keycloak [***dependency***]
* RabbitMQ [***dependency***]

## API

* Authentication [**required**]: `Authorization` header with bearer token.
* Query/Muation documented via API introspection, supported in most GraphQL
  clients.

[documentation]: https://docs.lagoon.sh/
