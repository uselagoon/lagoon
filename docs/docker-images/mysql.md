# MySQL

MySQL is a widely used, open-source relational database management system (RDBMS).

The [Lagoon `MySQL` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/8.4.Dockerfile). Based on the official upstream docker image [`mysql`](https://hub.docker.com/_/mysql) (Oracle Linux variant).

This Dockerfile is intended to be used to set up a standalone MySQL database server, intended for use in Local Development

* 8.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/8.0.Dockerfile) (Extended Support until April 2026) - `uselagoon/mysql-8.0`
* 8.4 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/8.4.Dockerfile) (Extended Support until April 2032) - `uselagoon/mysql-8.4`

!!! Info
    These images are not intended as drop-in alernatives to MariaDB images, and as such, may require customization to run in local development environments

## Lagoon adaptions

The default exposed port of MySQL containers is port `3306`.

To allow Lagoon to select the best way to run the MySQL container, use `lagoon.type: mariadb` - this allows the DBaaS operator to provision a cloud database if available in the cluster. Use `lagoon.type: mariadb-single` to specifically request MySQL in a container. Persistent storage is always provisioned for MySQL containers at `/var/lib/mysql`.

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* `readiness-probe.sh` script to check when MySQL container is ready.

## `docker-compose.yml` snippet for non-Drupal projects

```yaml title="docker-compose.yml"
	mysql:
		image: uselagoon/mysql-8.4:latest
		labels:
		# tells Lagoon this is a MariaDB-compatible database
			lagoon.type: mariadb
		ports:
			# exposes the port 3306 with a random local port, find it with `docker compose port mysql 3306`
			- "3306"
		volumes:
			# mounts a named volume at the default path for MySQL
			- db:/var/lib/mysql
```
## `docker-compose.yml` snippet for Drupal projects

```yaml title="docker-compose.yml"
	mariadb:
		image: uselagoon/mysql-8.4:latest
		labels:
		# tells Lagoon this is a MariaDB-compatible database
			lagoon.type: mariadb
		ports:
			# exposes the port 3306 with a random local port, find it with `docker compose port mariadb 3306`
			- "3306"
    environment:
			# These override the default credentials to match what Drupal is hardwired to expect in Lagoon
      - MYSQL_DATABASE=drupal
      - MYSQL_USER=drupal
      - MYSQL_PASSWORD=drupal
		volumes:
			# mounts a named volume at the default path for MariaDB
			- db:/var/lib/mysql
```

## Included tools

* [`mysqltuner.pl`](https://github.com/major/MySQLTuner-perl) - Perl script useful for database parameter tuning.
* [`mysql-backup.sh`](https://github.com/uselagoon/lagoon-images/blob/main/images/mysql/mysql-backup.sh) - Script for automating the daily MySQL backups on development environment.
* [`pwgen`](https://linux.die.net/man/1/pwgen) - Utility to generate random and complex passwords.

## Included `my.cnf` configuration file

The image ships a _default_ MySQL configuration file, optimized to work on
Lagoon. Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

## Environment Variables

| Environment Variable               | Default               | Description |
| :--------------------------------- | :-------------------- | :--------------------------------------------------------------------------- |
| MYSQL_DATABASE                     | lagoon                | Database name created at startup.                                            |
| MYSQL_USER                         | lagoon                | Default user created at startup.                                             |
| MYSQL_PASSWORD                     | lagoon                | Password of default user created at startup.                                 |
| MYSQL_ROOT_PASSWORD                | Lag00n                | MySQL root user's password.                                                  |
| MYSQL_CHARSET                      | utf8mb4               | Set the server charset.                                                      |
| MYSQL_COLLATION                    | utf8mb4_bin           | Set server collation.                                                        |
| MYSQL_MAX_ALLOWED_PACKET           | 64M                   | Set the `max_allowed_packet` size.                                           |
| MYSQL_INNODB_BUFFER_POOL_SIZE      | 256M                  | Set the MySQL InnoDB buffer pool size.                                       |
| MYSQL_INNODB_BUFFER_POOL_INSTANCES | 1                     | Number of InnoDB buffer pool instances.                                      |
| MYSQL_INNODB_LOG_FILE_SIZE         | 64M                   | Size of InnoDB log file.                                                     |
| MYSQL_LOG_SLOW                     | (not set)             | Variable to control the save of slow queries.                                |
| MYSQL_LOG_QUERIES                  | (not set)             | Variable to control the save of ALL queries.                                 |
| BACKUPS_DIR                        | /var/lib/mysql/backup | Default path for databases backups.                                          |
| MYSQL_DATA_DIR                     | /var/lib/mysql        | Path of the MySQL data dir, be careful, changing this can occur data loss!   |
| MYSQL_COPY_DATA_DIR_SOURCE         | (not set)             | Path which the entrypoint script of MySQL will use to copy into the defined `MYSQL_DATA_DIR`, this can be used for prepopulating the MySQL with a database. The scripts expects actual MySQL data files and not a sql file! Plus it only copies data if the destination does not already have a MySQL datadir in it. |

If the `LAGOON_ENVIRONMENT_TYPE` variable is set to `production`, performances
are set accordingly by using `MYSQL_INNODB_BUFFER_POOL_SIZE=1024` and
`MYSQL_INNODB_LOG_FILE_SIZE=256`.
