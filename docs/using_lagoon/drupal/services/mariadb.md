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
