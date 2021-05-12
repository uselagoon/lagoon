<p align="center"><img
src="https://raw.githubusercontent.com/amazeeio/lagoon/main/docs/images/lagoon-logo.png"
alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut"
width="40%"></p>

This service is part of amazee.io Lagoon, a Docker build and deploy system for
OpenShift & Kubernetes. Please reference our [documentation] for detailed
information on using, developing, and administering Lagoon.

# Auth Server (`auth-server`)

Generates authentication tokens that are valid for other lagoon services.

## Technology

* Node.js
* Rest API

## Related Services

* Keycloak [***dependency***]
* SSH [***dependent***]

## API

* Authentication [**required**]: `Authorization` header with bearer token
* **POST** `/generate`
* Body [`application/json`]:
    ```json
    {
      "userId": 1,
      "grant": true,
      "verbose": true
    }
    ```
* Responses `401`, `403`, `500`; `200`:
    ```
    {
      payload: {
        userId,
      },
      token,
      grant,
    }
    ```

[documentation]: https://docs.lagoon.sh/
