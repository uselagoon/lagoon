# HarborClairAdapter Settings
HarborClairAdapter requires specific environment variables to be set in order to start, which are stored within secrets as described in the `services/harborclairadapter/harborclair.yml` file.

## Config File Contents

* `CORE_URL`
  * This value tells HarborClairAdapter where Harbor-Core can be reached.
  * The default value is `http://harbor-core:8080`.
* `SCANNER_CLAIR_DATABASE_URL`
  * This value tells HarborClairAdapter how to connect to HarborClair's postgres database.
  * The default value is `postgres://postgres:test123@harbor-database:5432/postgres?sslmode=disable` when Harbor is run locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon, as the postgres password needs to be injected here.
* `SCANNER_CLAIR_URL`
  * This value tells HarborClairAdapter where it can be reached by other containers and/or services.
  * The default value is `http://harborclair:6060`.
* `SCANNER_LOG_LEVEL`
  * The logging level this service should use.
  * The default value is `error`.
    * This can also be set to `debug` to enable very verbose logging.
* `SCANNER_STORE_REDIS_URL`
  * This value tells HarborClairAdapter how to connect to HarborClair's Redis store.
  * The default value is `redis://harbor-redis:6379/4`.