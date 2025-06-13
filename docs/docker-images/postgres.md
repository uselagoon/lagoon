# PostgreSQL

The [Lagoon PostgreSQL Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres). Based on [the official PostgreSQL Alpine images](https://hub.docker.com/_/postgres).

## Supported versions

* 11 \(available for compatibility only, no longer officially supported\) - `uselagoon/postgres-11`
* 12 \(available for compatibility only, no longer officially supported\) - `uselagoon/postgres-12`
* 13 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/13.Dockerfile) (Security Support until November 2025) - `uselagoon/postgres-13`
* 14 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/14.Dockerfile) (Security Support until November 2026) - `uselagoon/postgres-14`
* 15 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/15.Dockerfile) (Security Support until November 2027) - `uselagoon/postgres-15`
* 16 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/16.Dockerfile) (Security Support until November 2028) - `uselagoon/postgres-16`
* 17 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/17.Dockerfile) (Security Support until November 2029) - `uselagoon/postgres-17`

!!! Tip
    We stop updating EOL PostgreSQL images usually with the Lagoon release that comes after the officially communicated EOL date: [https://www.postgresql.org/support/versioning](https://www.postgresql.org/support/versioning/)

## Lagoon adaptions

The default exposed port of Postgres containers is port `5432`.

To allow Lagoon to select the best way to run the Postgres container, use `lagoon.type: postgres` - this allows DBaaS operator to provision a cloud database if available in the cluster. Use `lagoon.type: postgres-single` to specifically request Postgres in a container. Persistent storage is always provisioned for postgres containers at /var/lib/postgresql/data.

## `docker-compose.yml` snippet

```yaml title="docker-compose.yml"
postgres:
  image: uselagoon/postgres-14-drupal:latest
  labels:
    # tells Lagoon this is a Postgres database
    lagoon.type: postgres
  ports:
    # exposes the port 5432 with a random local port
    # find it with `docker compose port postgres 5432`
    - "5432"
  volumes:
   	# mounts a named volume at the default path for Postgres
    - db:/var/lib/postgresql/data
```

## Tips & Tricks

If you have SQL statements that need to be run immediately after container startup to initialize the database, you can place those `.sql` files in the container's `docker-entrypoint-initdb.d` directory. Any `.sql` files contained in that directory are run automatically at startup, as part of bringing the PostgreSQL container up.

!!! Warning
    These scripts are only run if the container is started with an empty database.
