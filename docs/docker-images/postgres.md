# PostgreSQL

The [Lagoon PostgreSQL Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres). Based on [the official PostgreSQL Alpine images](https://hub.docker.com/_/postgres).

## Supported versions

* 11 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/11.Dockerfile)
* 12 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres/12.Dockerfile)

## Tips & Tricks

If you have SQL statements that need to be run immediately after container startup to initialize the database, you can place those `.sql` files in the container's `docker-entrypoint-initdb.d` directory. Any `.sql` files contained in that directory are run automatically at startup, as part of bringing the PostgreSQL container up.

{% hint style="info" %}
Take note that these scripts are only run if the container is started with an empty database.
{% endhint %}

