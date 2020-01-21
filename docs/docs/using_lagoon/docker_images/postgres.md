# postgres

## Postgres Image

## Supported versions

* 11.x [\[Dockerfile\]](https://github.com/amazeeio/lagoon/blob/master/images/postgres/Dockerfile)

## Tips & Tricks

If you have SQL statements that need to be ran immediately after container startup to initalize the database, you can place those `.sql` files in the container's `docker-entrypoint-initdb.d` directory. Any `.sql` files contained in that directory are ran automatically at startup, as part of bringing the Postgres container up. _**Take note that these scripts are only ran if the container is started with an empty database.**_

