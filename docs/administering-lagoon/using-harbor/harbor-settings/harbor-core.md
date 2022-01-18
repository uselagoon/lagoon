# Harbor-Core

Harbor-Core requires a configuration file to start, which is located at `/etc/core/app.conf` within the container. Any changes made to this config file are temporary and will not persist once the pod is restarted.

The configmap from which this config file is generated is stored within Lagoon in the `services/harbor-core/harbor-core.yml` file. Any changes made to this configmap will be persisted across container restarts.

## Config File Contents

* `_REDIS_URL`
  * Tells harbor-core and the Chartmuseum service connection info for the Redis server.
  * The default value is `harbor-redis:6379,100,`.
* `_REDIS_URL_REG`
  * The url which harborregistry should use to connect to the Redis server.
  * The default value is `redis://harbor-redis:6379/2`.
* `ADMIRAL_URL`
  * Tells harbor-core where to find the admiral service.
  * This service is **not** used with Lagoon's implementation of Harbor.
  * The default value is `NA`.
* `CFG_EXPIRATION`
  * This value is not used.
  * The default value is `5`.
* `CHART_CACHE_DRIVER`
  * Tells harbor-core where to store any uploaded charts.
  * The default value is `redis`.
* `CLAIR_ADAPTER_URL`
  * The URL that harbor-core should use to connect to the harbor-trivy service.
  * The default value is `http://harbor-trivy:8080`.
* `CLAIR_DB`
  * The database type harborclair should use.
  * This value is not used, and is included only for legacy support
  * The default value is `postgres`.
* `CLAIR_DB_HOST`
  * This value is not used, and is included only for legacy support
  * Tells harbor-core where to find the harborclair service.
  * The default value is `harbor-database`.
* `CLAIR_DB_PASSWORD`
  * The password used to access harborclair's postgres database.
  * The default value is `test123` when run locally or during CI testing.
  * This value is not used, and is included only for legacy support
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* `CLAIR_DB_PORT`
  * The port harborclair should use to connect to the harborclair server.
  * This value is not used, and is included only for legacy support
  * The default value is `5432`.
* `CLAIR_DB_SSLMODE`
  * Whether or not harborclair should use SSL to connect to the postgresql server.
  * This value is not used, and is included only for legacy support
  * The default value is `disable`.
* `CLAIR_DB_USERNAME`
  * The user harborclair should use to connect to the postgresql server.
  * This value is not used, and is included only for legacy support
  * The default value is `postgres`.
* `CLAIR_HEALTH_CHECK_SERVER_URL`
  * This value tells harbor-core where it should issue health checks to for the harbor-trivy service.
  * The default value is `http://harbor-trivy:8080`
* `CLAIR_URL`
  * The URL that harbor-core should use to connect to the harbor-trivy service.
  * The default value is `http://harbor-trivy:6060`.
* `CONFIG_PATH`
  * Where harbor-core should look for its config file.
  * The default value is `/etc/core/app.conf`.
* `CORE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to harbor-core.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* `CORE_URL`
  * The URL that harbor-core should publish to other Harbor services in order for them to connect to the harbor-core service.
  * The default value is `http://harbor-core:8080`.
* `DATABASE_TYPE`
  * The database type Harbor should use.
  * The default value is `postgresql`.
* `HARBOR_ADMIN_PASSWORD`
  * The password which should be used to access harbor using the `admin` user.
  * The default value is `admin` when run locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first set up on a running Lagoon.
* `HARBOR_NGINX_ENDPOINT`
  * This environment variable tells harborregistry where its Nginx ingress controller, harbor-nginx, is running in order to construct proper push and pull instructions in the UI, among other things.
  * The default value is set to `http://harbor-nginx:8080` when run locally or during CI testing.
  * Lagoon attempts to obtain and set this variable automagically when run in production. If that process fails, this service will fail to run.
* `HTTP_PROXY`
  * The default value is an empty string.
* `HTTPS_PROXY`
  * The default value is an empty string.
* `JOBSERVICE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to harbor-jobservice.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* `JOBSERVICE_URL`
  * The URL that harbor-core should use to connect to the harbor-jobservice service.
  * The default value is `http://harbor-jobservice:8080`.
* `LOG_LEVEL`
  * The default log level of the harbor-core service.
  * The default value is `error`.
* `NO_PROXY`
  * A list of hosts which should never have their requests proxied.
  * The default is `harbor-core,harbor-jobservice,harbor-database,harbor-trivy,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`.
* `PORTAL_URL`
  * This value tells the service where to connect to the harbor-portal service.
  * The default value is `http://harbor-portal:8080`.
* `POSTGRESQL_DATABASE`
  * The postgres database harbor-core should use when connecting to the postgresql server.
  * The default value is `registry`.
* `POSTGRESQL_HOST`
  * Where harbor-core should connect to the postgresql server.
  * The default value is `harbor-database`.
* `POSTGRESQL_MAX_IDLE_CONNS`
  * The maximum number of idle connections harbor-core should leave open to the postgresql server.
  * The default value is `50`.
* `POSTGRESQL_MAX_OPEN_CONNS`
  * The maximum number of open connections harbor-core should have to the postgresql server.
  * The default value is `100`.
* `POSTGRESQL_PASSWORD`
  * The password Harbor should use to connect to the postgresql server.
  * The default value is a randomly generated value.
* `POSTGRESQL_PORT`
  * The port harbor-core should use to connect to the postgresql server.
  * The default value is `5432`.
* `POSTGRESQL_USERNAME`
  * The username harbor-core should use to connect to the postgresql server.
  * The default value is `postgres`.
* `POSTGRESQL_SSLMODE`
  * Whether or not harbor-core should use SSL to connect to the postgresql server.
  * The default value is `disable`.
* `REGISTRY_HTTP_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to harborregistry.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first set up on a running Lagoon.
* `REGISTRY_STORAGE_PROVIDER_NAME`
  * The storage backend that harborregistry should use.
  * The default value is `s3`.
* `REGISTRY_URL`
  * The URL that harbor-core should use to connect to the harborregistry service..
  * The default value is `http://harborregistry:5000`.
* `REGISTRYCTL_URL`
  * This value tells the service where to connect to the harborregistryctl service.
  * The default value is set to `http://harborregistryctl:8080`.
* `ROBOT_TOKEN_DURATION`
  * This values sets how many days each issues robot token should be valid for.
  * The default value is set to `999`.
* `SYNC_REGISTRY`
  * This value is not used.
  * The default value is `false`.
* `TOKEN_SERVICE_URL`
  * The URL that the harbor-core service publishes to other services in order to retrieve a JWT token.
  * The default value is `http://harbor-core:8080/service/token`.
* `TRIVY_ADAPTER_URL`
  * The URL that the harbor-core service should use to connect to the harbor-trivy service.
  * The default value is `http://harbor-trivy:8080`.
* `WITH_CHARTMUSEUM`
  * Tells harbor-core if the Chartmuseum service is being used.
  * This service is **not** used with Lagoon's implementation of Harbor.
  * The default value is `false`.
* `WITH_CLAIR`
  * Tells harbor-core if the harborclair service is being used.
  * Lagoon **does** use this service in its implementation of Harbor.
  * The default value is `true`.
* `WITH_NOTARY`
  * Tells harbor-core if the Notary service is being used.
  * This service is **not** used with Lagoon's implementation of Harbor.
  * The default value is `false`.
* `WITH_TRIVY`
  * Tells harbor-core if the Trivy service is being used.
  * The default value is `true`.
