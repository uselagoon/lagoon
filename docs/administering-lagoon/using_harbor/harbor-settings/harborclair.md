# HarborClair

HarborClair requires a configuration file to start, which is located at `/etc/clair/config.yaml` within the container. This config file is stored within the `services/harborclair/harbor-core.yml` file.

## Config File Contents

* **`CLAIR_DB_PASSWORD`**
  * The password used to access `harborclair`'s Postgres database.
  * The default value is `test123` when run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`HTTP_PROXY`**
  * The default value is an empty string.
* **`HTTPS_PROXY`**
  * The default value is an empty string.
* **`NO_PROXY`**
  * A list of hosts which should never have their requests proxied.
  * The default is `harbor-core,harbor-jobservice,harbor-database,harborclair,harborclairadapter,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`
* **`SCANNER_CLAIR_DATABASE_URL`**
  * This value tells `harborclair` how to connect to its Postgres database.
  * The default value is `postgres://postgres:test123@harbor-database:5432/postgres?sslmode=disable` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon, as the Postgres password needs to be injected here.
* **`SCANNER_LOG_LEVEL`**
  * The logging level this service should use.
  * The default value is `error`.
    * This can also be set to `debug` to enable very verbose logging.
* **`SCANNER_STORE_REDIS_URL`**
  * This value tells `harborclair` how to connect to its Redis store.
  * The default value is `redis://harbor-redis:6379/4`.

