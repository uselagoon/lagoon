---
description: Configuring Applications for use on Lagoon
---

# Configuring Applications for use on Lagoon

## `lagoon.yml`

Project- and environment-level configuration for Lagoon is provided in the `.lagoon.yml` file in your repository.

See [`lagoon-yml.md`](../using-lagoon-the-basics/lagoon-yml.md).

## `docker-compose.yml`

Service-level configuration for Lagoon in provided in the `docker-compose.yml` file in your repository. In particular, the `lagoon.type` and associated service labels are documented in the individual services.

See [`docker-compose-yml.md`](../using-lagoon-the-basics/docker-compose-yml.md)

## Storage

Lagoon has the ability to provision storage for most services - the built-in Lagoon service types have a `-persistent` variant that can add in the necessary PVCs, volumes, etc. We have updated our examples to reflect this configuration locally.

## Databases

Lagoon has configurations available for:

* Mariadb - all supported versions
* PostgreSQL - all supported versions

### Database-as-a-service

Lagoon also has the capability to utilize the [dbaas-operator](https://github.com/amazeeio/dbaas-operator) to automatically provision these databases using an underlying managed database service (i.e. RDS, Google Cloud Databases, Azure Database). This will happen automatically when these services are provisioned and configured for your cluster. If these are not available, a pod will be provisioned as a fallback.

## Cache

Lagoon supports Redis as a cache backend. In production, some users provision a managed Redis service for their production environments to help them scale.

## Search

Lagoon supports Elasticsearch, Solr and OpenSearch as search providers. External search providers can also be configured if required.

## Ingress/Routes

Lagoon auto-generates routes for services that have ingress requirements. Custom routes can be provided in the `.lagoon.yml` on a per-service basis.

## Environment Variables

Lagoon makes heavy use of environment variables, at build and runtime. Where these are used to provide critical configuration for your application (e.g. database config/credentials) - it is important that the local and Lagoon versions are named similarly.

See [environment-variables.md](../using-lagoon-advanced/environment-variables.md).
