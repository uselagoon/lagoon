# MariaDB

MariaDB is the open source successor to MySQL.

The [Lagoon `MariaDB` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.6.Dockerfile). Based on the official packages [`mariadb`](https://pkgs.alpinelinux.org/packages?name=mariadb&branch=edge) and [`mariadb-client`](https://pkgs.alpinelinux.org/packages?name=mariadb-client&branch=edge) provided by the the upstream Alpine image.

This Dockerfile is intended to be used to set up a standalone MariaDB database server.

* 10.4 \(available for compatibility only, no longer officially supported\) - `uselagoon/mariadb-10.4`
* 10.5 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.5.Dockerfile) (Alpine 3.14 Support until May 2023) - `uselagoon/mariadb-10.5`
* 10.6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.6.Dockerfile) (Alpine 3.16 Support until May 2024) - `uselagoon/mariadb-10.6`
* 10.11 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/10.11.Dockerfile) (Alpine 3.18 Support until May 2025) - `uselagoon/mariadb-10.11`

!!! Info
    As these images are not built from the upstream MariaDB images, their support follows a different cycle - and will only receive updates as long as the underlying Alpine images receive support - see [https://alpinelinux.org/releases/](https://alpinelinux.org/releases/) for more information. In practice, most MariaDB users will only be running these containers locally - the production instances will use the Managed Cloud Databases provided by the DBaaS Operator

## Lagoon adaptions

The default exposed port of MariaDB containers is port `3306`.

To allow Lagoon to select the best way to run the MariaDB container, use `lagoon.type: mariadb` - this allows the DBaaS operator to provision a cloud database if available in the cluster. Use `lagoon.type: mariadb-single` to specifically request MariaDB in a container. Persistent storage is always provisioned for MariaDB containers at `/var/lib/mysql`.

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* `readiness-probe.sh` script to check when MariaDB container is ready.

## `docker-compose.yml` snippet

```yaml title="docker-compose.yml"
	mariadb:
		image: uselagoon/mariadb-10.6-drupal:latest
		labels:
		# tells Lagoon this is a MariaDB database
			lagoon.type: mariadb
		ports:
			# exposes the port 3306 with a random local port, find it with `docker compose port mariadb 3306`
			- "3306"
		volumes:
			# mounts a named volume at the default path for MariaDB
			- db:/var/lib/mysql
```

## Included tools

* [`mysqltuner.pl`](https://github.com/major/MySQLTuner-perl) - Perl script useful for database parameter tuning.
* [`mysql-backup.sh`](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb/mysql-backup.sh) - Script for automating the daily MySQL backups on development environment.
* [`pwgen`](https://linux.die.net/man/1/pwgen) - Utility to generate random and complex passwords.

## Included `my.cnf` configuration file

The image ships a _default_ MariaDB configuration file, optimized to work on
Lagoon. Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

## Environment Variables

| Environment Variable                 | Default               | Description |
| :----------------------------------- | :-------------------- | :--------------------------------------------------------------------------- |
| MARIADB_DATABASE                     | lagoon                | Database name created at startup.                                            |
| MARIADB_USER                         | lagoon                | Default user created at startup.                                             |
| MARIADB_PASSWORD                     | lagoon                | Password of default user created at startup.                                 |
| MARIADB_ROOT_PASSWORD                | Lag00n                | MariaDB root user's password.                                                |
| MARIADB_CHARSET                      | utf8mb4               | Set the server charset.                                                      |
| MARIADB_COLLATION                    | utf8mb4_bin           | Set server collation.                                                        |
| MARIADB_MAX_ALLOWED_PACKET           | 64M                   | Set the `max_allowed_packet` size.                                           |
| MARIADB_INNODB_BUFFER_POOL_SIZE      | 256M                  | Set the MariaDB InnoDB buffer pool size.                                     |
| MARIADB_INNODB_BUFFER_POOL_INSTANCES | 1                     | Number of InnoDB buffer pool instances.                                      |
| MARIADB_INNODB_LOG_FILE_SIZE         | 64M                   | Size of InnoDB log file.                                                     |
| MARIADB_LOG_SLOW                     | (not set)             | Variable to control the save of slow queries.                                |
| MARIADB_LOG_QUERIES                  | (not set)             | Variable to control the save of ALL queries.                                 |
| BACKUPS_DIR                          | /var/lib/mysql/backup | Default path for databases backups.                                          |
| MARIADB_DATA_DIR                     | /var/lib/mysql        | Path of the MariaDB data dir, be careful, changing this can occur data loss! |
| MARIADB_COPY_DATA_DIR_SOURCE         | (not set)             | Path which the entrypoint script of mariadb will use to copy into the defined `MARIADB_DATA_DIR`, this can be used for prepopulating the MariaDB with a database. The scripts expects actual MariaDB data files and not a sql file! Plus it only copies data if the destination does not already have a mysql datadir in it. |

If the `LAGOON_ENVIRONMENT_TYPE` variable is set to `production`, performances
are set accordingly by using `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` and
`MARIADB_INNODB_LOG_FILE_SIZE=256`.
