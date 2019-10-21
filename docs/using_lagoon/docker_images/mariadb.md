# MariaDB Image
Lagoon `MariaDB` image Dockerfile, based on offical packages `mariadb` and `mariadb-client` provided by the `alpine:3.8` image.

This Dockerfile is intended to be used to setup a standalone MariaDB database server.

## Lagoon & OpenShift adaptions
This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- `readiness-probe.sh` script to check when mariadb container's readiness.

## Included tools

- `mysqltuner.pl` - Perl script useful for database's parameters tuning
- `mysql-backup.sh` - script for automating the daily mysql backups on development computer
- `pwgen` - utility to generate random and complex passwords

## Included `my.cnf` configuration file
The image ships a *default* MariaDB configuration file, optimized to work on Lagoon.  
Some options are configurable via environments variables (see [Environment Variables](#environment-variables)).

## Environment Variables
Environment variables defined in MariaDB base image

| Environment Variable              | Default             | Description                                    |
| ---------------------------------      | ---------      | ---------------------------------------------- |
| `MARIADB_DATABASE`                     |   lagoon 	    | Database name created at startup               |
| `MARIADB_USER`                         |   lagoon 	    | Default user created at startup                |
| `MARIADB_PASSWORD`                     |   lagoon 	    | Password of default user createt at startup    |
| `MARIADB_ROOT_PASSWORD`                |   Lag00n 	    | MariaDB root user's password                   |
| `MARIADB_CHARSET`                      |   utf8mb4 	    | Set the server charset                         |
| `MARIADB_COLLATION`                    |   utf8mb4_bin 	| Set server collation                           |
| `MARIADB_INNODB_BUFFER_POOL_SIZE`      |   256M	        | Set the MariaDB InnoDB Buffer Pool Size        |
| `MARIADB_INNODB_BUFFER_POOL_INSTANCES` |   1            | Number of InnoDB Buffer Pool instances         |
| `MARIADB_INNODB_LOG_FILE_SIZE`         |   64M          | Size of InnoDB log file                        |
| `MARIADB_LOG_SLOW`                     | empty          | Variable to control the save of slow queries   |
| `MARIADB_LOG_QUERIES`                  | empty          | Variable to control the save of ALL queries    |
| `BACKUPS_DIR`                          |  /var/lib/mysql/backup | Default path for databases' backups    |

## MariaDB Drupal image
Lagoon `mariadb-drupal` Docker image, is a customized `mariadb` image to use within Drupal projects in Lagoon.  
It differs from `mariadb` only for initial database setup, made by some environment variables:

| Environment Variable              | Default             | Description                                    |
| ---------------------------------      | ---------      | ---------------------------------------------- |
| `MARIADB_DATABASE`                     |   drupal 	    | Drupal database created at startup             |
| `MARIADB_USER`                         |   drupal 	    | Default user created at startup                |
| `MARIADB_PASSWORD`                     |   drupal 	    | Password of default user createt at startup    |