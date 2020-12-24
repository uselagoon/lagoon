# MariaDB-Drupal

MariaDB is the open source successor to MySQL.

The \[Lagoon `mariadb-drupal` Docker image\]\(\* 11 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb-drupal/Dockerfile) is a customized [`mariadb` image](./) to use within Drupal projects in Lagoon. It differs from the `mariadb` image only for initial database setup, made by some environment variables:

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `MARIADB_DATABASE` | drupal | Drupal database created at startup. |
| `MARIADB_USER` | drupal | Default user created at startup. |
| `MARIADB_PASSWORD` | drupal | Password of default user created at startup. |

If the `LAGOON_ENVIRONMENT_TYPE` variable is set to `production`, performances are set accordingly by using `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` and `MARIADB_INNODB_LOG_FILE_SIZE=256`.

