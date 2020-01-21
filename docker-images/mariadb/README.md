# mariadb

MariaDB is the open source successor to MySQL.

[Lagoon `MariaDB` image Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/mariadb/Dockerfile), based on offical packages `mariadb` and `mariadb-client` provided by the `alpine:3.8` image.

This Dockerfile is intended to be used to setup a standalone MariaDB database server.

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions)so this image will work with a random user, and therefore also on OpenShift.
* `readiness-probe.sh` script to check when MariaDB container is ready.

## Included tools

* [`mysqltuner.pl`](https://github.com/major/MySQLTuner-perl) - Perl script useful for database parameter tuning.
* [`mysql-backup.sh`](https://github.com/amazeeio/lagoon/blob/master/images/mariadb/mysql-backup.sh) - Script for automating the daily MySQL backups ondevelopment machine.
* [`pwgen`](https://linux.die.net/man/1/pwgen) - Utility to generate random and complex passwords.

## Included `my.cnf` configuration file

The image ships a _default_ MariaDB configuration file, optimized to work on Lagoon. Some options are configurable via environments variables \(see [Environment Variables](../../environment-variables.md)\).

## Environment Variables

Environment variables defined in MariaDB base image:

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `MARIADB_DATABASE` | lagoon | Database name created at startup |
| `MARIADB_USER` | lagoon | Default user created at startup |
| `MARIADB_PASSWORD` | lagoon | Password of default user created at startup |
| `MARIADB_ROOT_PASSWORD` | Lag00n | MariaDB root user's password |
| `MARIADB_CHARSET` | utf8mb4 | Set the server charset |
| `MARIADB_COLLATION` | utf8mb4\_bin | Set server collation |
| `MARIADB_MAX_ALLOWED_PACKET` | 64M | Set the max\_allowed\_packet size |
| `MARIADB_INNODB_BUFFER_POOL_SIZE` | 256M | Set the MariaDB InnoDB Buffer Pool Size |
| `MARIADB_INNODB_BUFFER_POOL_INSTANCES` | 1 | Number of InnoDB Buffer Pool instances |
| `MARIADB_INNODB_LOG_FILE_SIZE` | 64M | Size of InnoDB log file |
| `MARIADB_LOG_SLOW` | empty | Variable to control the save of slow queries |
| `MARIADB_LOG_QUERIES` | empty | Variable to control the save of ALL queries |
| `BACKUPS_DIR` | /var/lib/mysql/backup | Default path for databases' backups |

If the `LAGOON_ENVIRONMENT_TYPE` variable is set to `production`, performances are set accordingly by using `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` and `MARIADB_INNODB_LOG_FILE_SIZE=256`.

