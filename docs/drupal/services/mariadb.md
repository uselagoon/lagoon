---
description: MariaDB is the open source successor to MySQL.
---

# MariaDB

## Galera

[MariaDB Galera Cluster](https://mariadb.com/kb/en/galera-cluster/) is a synchronous multi-master cluster for MariaDB.

For improved reliability, MariaDB can be used in a cluster for production sites. This example, when placed in `.lagoon.yml` will enable Galera on the `production` branch.

```yaml title=".lagoon.yml"
environments:
  production:
    types:
      mariadb: mariadb-galera
```

Also, you will need to change your service definition in your `docker-compose.yml`

```yaml title="docker-compose.yml"
  mariadb:
    image: amazeeio/mariadb-galera-drupal
    labels:
      lagoon.type: mariadb
    ports:
      - "3306" # Exposes the port 3306 with a random local port, find it with `docker-compose port mariadb 3306`.
    environment:
      << : *default-environment
```

It is recommended that you configure the environment _before_ the initial deploy of the production site, otherwise manual intervention may be needed from your Lagoon administrator.

## Additional MariaDB [Logging](../../logging/logging.md)

During the course of development, it may be necessary to enable either query logging or slow query logging. To do so, set the environment variables `MARIADB_LOG_SLOW` or `MARIADB_LOG_QUERIES`. This can be done in `docker-compose.yml`.

## Connecting to MySQL container from the host

If you would like to connect to your MySQL database inside the Docker container with an external tool like [Sequel Pro](http://www.sequelpro.com/), [MySQL Workbench](http://www.mysql.com/products/workbench/), [HeidiSQL](http://www.heidisql.com/), [DBeaver](http://dbeaver.jkiss.org/), plain old `mysql-cli` or anything else, here's how to get the IP and port info.

### Get published MySQL port from the container

By default, Docker assigns a randomly published port for MySQL during each container start. This is done to prevent port collisions.

To get the published port via `docker`:

Run: `docker port [container_name]`.

```text
$ docker port drupal_example_mariadb_1
3306/tcp -> 0.0.0.0:32797
```

Or via `docker-compose` inside a Drupal repository:

Run: `docker-compose port [service_name] [interal_port]`.

```text
$ docker-compose port mariab 3306
0.0.0.0:32797
```

## Setting a static port (not recommended)

During development, if you are using an external database tool, it may become cumbersome to continually check and set the MySQL connection port.

To set a static port, edit your service definition in your `docker-compose.yml`.

```yaml title="docker-compose.yml"
  mariadb:
    ...
    ports:
      - "33772:3306" # Exposes port 3306 with a 33772 on the host port. Note by doing this you are responsible for managing port collisions`.
```

!!! warning "Warning:"
    By setting a static port you become responsible for managing port collisions.

### Connect to MySQL

Now you can use these details to connect to whatever database management tool you'd like.

|  | Linux | OS X |
| :--- | :--- | :--- |
| IP/Host | IP from container | `docker.amazee.io` |
| Port | Published port from container | Published port from container |
| Username | `drupal` | `drupal` |
| Password | `drupal` | `drupal` |
| Database | `drupal` | `drupal` |
