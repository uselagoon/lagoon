# Wrestic snapshot webhook handler

Build, then deploy. Requires the following vars to start

```
RABBITMQ_ADDRESS=broker
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
JWT_SECRET="super-secret-string"
JWT_AUDIENCE="api.dev"
GRAPHQL_ENDPOINT="http://api:3000/graphql"
```

## Build

```
./build-push ${TAG:-latest} ${REPO:-amazeeiolagoon}
```
