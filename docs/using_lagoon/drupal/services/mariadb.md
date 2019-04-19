# MariaDB

### Galera

For improved reliability, MariaDB can be used in a cluster for production sites.
This example, when placed in `.lagoon.yml` will enable Galera on the
`production` branch.

```
environments:
  production:
    types:
      mariadb: mariadb-galera
```

also you will need to change your service definition in your `docker-compose.yml`

```
  mariadb:
    image: amazeeio/mariadb-galera-drupal
    labels:
      lagoon.type: mariadb
    ports:
      - "3306" # exposes the port 3306 with a random local port, find it with `docker-compose port mariadb 3306`
    environment:
      << : *default-environment
```

It is recommended to configure the environment before the initial deploy of the
production site, otherwise manual intervention may be needed from your lagoon
administrator.

### Additional MariaDB Logging

During the course of development, it may be necessary to enable either query
logging or slow query logging. To do so just set the environment variables
`MARIADB_LOG_SLOW` or `MARIADB_LOG_QUERIES`. This can be done in
`docker-compose.yaml`.



### Connecting to MySQL's container from the host

If you like to connect to MySQL's Database inside the Docker container with an external Tool like [Sequel Pro](http://www.sequelpro.com/), [MySQL Workbench](http://www.mysql.com/products/workbench/), [HeidiSQL](http://www.heidisql.com/), [DBeaver](http://dbeaver.jkiss.org/), just plain old `mysql-cli` or anything else.

#### Get published MySQL port from the container

By default, Docker assigns a randomly published port for MySQL during each container start. This is done to prevent port collisions.

To get the published port via `docker`:

Run: ```docker port[container_name]```

    $ docker port drupal_example_mariadb_1    
    3306/tcp -> 0.0.0.0:32797

Or via `docker-compose` inside a Drupal repository

Run: ```docker-compose port [service_name] [interal_port]```

    $ docker-compose port mariab 3306
    0.0.0.0:32797

### Setting a static port (not recommended)

During development, if you are using an external database tool it may become cumbersome to continually check and set MySQL connection port.

To set a static port; edit your service definition in your `docker-compose.yml`

```
  mariadb:
    ...
    ports:
      - "33772:3306" # exposes port 3306 with a 33772 on the host port. Note by doing this you are responsible for managing port collisions`
```
**Note**

By setting a static port you become responsible for maniging port collisions.


#### Connect to MySQL

|          | Linux                         | OS X                          |
|----------|-------------------------------|-------------------------------|
| IP/Host  | ip from container             | `docker.amazee.io`            |
| Port     | published port from container | published port from container |
| Username | `drupal`                      | `drupal`                      |
| Password | `drupal`                      | `drupal`                      |
| Database | `drupal`                      | `drupal`                      |
