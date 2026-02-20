# Wrestic snapshot webhook handler

Build, then deploy. Requires the following vars to start

```
JWT_SECRET="super-secret-string"
JWT_AUDIENCE="api.dev"
GRAPHQL_ENDPOINT="http://api:3000/graphql"
```

## Build

```
./build-push ${TAG:-latest} ${REPO:-uselagoon}
```
