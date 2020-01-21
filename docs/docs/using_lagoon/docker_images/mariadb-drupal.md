# MariaDB Drupal image

Lagoon `mariadb-drupal` Docker image, is a customized `mariadb` image to use within Drupal projects in Lagoon.  
It differs from `mariadb` only for initial database setup, made by some environment variables:

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `MARIADB_DATABASE` | drupal | Drupal database created at startup |
| `MARIADB_USER` | drupal | Default user created at startup |
| `MARIADB_PASSWORD` | drupal | Password of default user createt at startup |

If `LAGOON_ENVIRONMENT_TYPE` variable is set to `production`, performances are set accordly by using `MARIADB_INNODB_BUFFER_POOL_SIZE=1024` and `MARIADB_INNODB_LOG_FILE_SIZE=256`.

