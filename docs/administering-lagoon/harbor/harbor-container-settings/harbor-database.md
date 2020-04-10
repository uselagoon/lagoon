# Harbor-Database Settings
Harbor-Database requires specific environment variables to be set in order to start, which are stored within secrets as described in the `services/harbor-database/harbor-core.yml` file.

## Config File Contents

* `POSTGRES_DB`
  * The default database to be set up when initalizing the postgres service.
  * The default value is `postgres`.
* `POSTGRES_PASSWORD`
  * The root password for the postgres database.
  * The default value is `test123`.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* `POSTGRES_USER`
  * The default user to be set up when initalizing the postgres service.
  * The default value is `postgres`.
