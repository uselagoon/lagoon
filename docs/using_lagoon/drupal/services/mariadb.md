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

It is recommended to configure the environment before the initial deploy of the
production site, otherwise manual intervention may be needed from your lagoon
administrator.

### Additional MariaDB Logging

During the course of development, it may be necessary to enable either query
logging or slow query logging. To do so just set the environment variables
`MARIADB_LOG_SLOW` or `MARIADB_LOG_QUERIES`. This can be done in
`docker-compose.yaml`.
