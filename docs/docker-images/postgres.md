# postgres

[Lagoon Postgres Docker image](https://github.com/amazeeio/lagoon/blob/master/images/postgres/Dockerfile), based on [the official Postgres Alpine images](https://hub.docker.com/_/postgres).

## Supported versions

* 11.x [\[Dockerfile\]](https://github.com/amazeeio/lagoon/blob/master/images/postgres/Dockerfile)

## Tips & Tricks

If you have SQL statements that need to be run immediately after container startup to initalize the database, you can place those `.sql` files in the container's `docker-entrypoint-initdb.d` directory. Any `.sql` files contained in that directory are run automatically at startup, as part of bringing the Postgres container up.

{% hint style="info" %}
Take note that these scripts are only run if the container is started with an empty database.
{% endhint %}



