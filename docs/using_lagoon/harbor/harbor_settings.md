# Running Harbor Locally
Lagoon supports running Harbor locally, and it is automatically used for hosting all kubernetes based builds (any time the project's `activeSystemsDeploy` value is set to `lagoon_kubernetesBuildDeploy`).

# Settings
Harbor is composed of multiple containers, which all require different settings in order for them to run successfully. 

## Environment Variables
The following environment variables are required to be set in order for Harbor to properly start:

* `HARBOR_REGISTRY_STORAGE_AMAZON_BUCKET`
  * This needs to be set to the name of the AWS bucket which Harbor will save images to
  * Defaults to `harbor-images` when Lagoon is ran locally or during CI testing
* `HARBOR_REGISTRY_STORAGE_AMAZON_REGION`
  * This needs to be set to the AWS region in which Harbor's bucket is located
  * Defaults to `us-east-1` when Lagoon is ran locally or during CI testing
* `REGISTRY_STORAGE_S3_ACCESSKEY`
  * This needs to be set to the AWS access key Harbor should use to read and write to the AWS bucket
  * Defaults to an empty string when Lagoon is ran locally or during CI testing, as MinIO does not require authentication
* `REGISTRY_STORAGE_S3_SECRETKEY`
  * This needs to be set to the AWS secret key Harbor should use to read and write to the AWS bucket
  * Defaults to an empty string when Lagoon is ran locally or during CI testing, as MinIO does not require authentication

The following environment variables can be set if required:

* `HARBOR_REGISTRY_STORAGE_AMAZON_ENDPOINT`
  * If this variable is set, the Harbor registry will use its value as the address of the s3 entrypoint
  * Defaults to `https://s3.amazonaws.com` when this variable is not set

## Harbor-Core Settings
Harbor-Core requires a configuration file to start, which is located at `/etc/core/app.conf` within the container. This config file is stored within the `services/harbor-core/harbor-core.yml` file.

* `DATABASE_TYPE`
  * The database type Harbor should use
  * The default value is `postgresql`
* `POSTGRESQL_HOST`
  * Where Harbor should connect to the postgresql server
  * The default value is `harbor-database`
* `POSTGRESQL_PORT`
  * The port Harbor should use to connect to the postgresql server
  * The default value is `5432`
* `POSTGRESQL_USERNAME`
  * The username Harbor should use to connect to the postgresql server
  * The default value is `postgres`
* `POSTGRESQL_PASSWORD`
  * The password Harbor should use to connect to the postgresql server
  * The default value is a randomly generated value
* `POSTGRESQL_DATABASE`
  * The postgres database Harbor should use when connecting to the postgresql server
  * The default value is `registry`
* `POSTGRESQL_SSLMODE`
  * Whether or not Harbor should use SSL to connect to the postgresql server
  * The default value is `disable`
* `POSTGRESQL_MAX_IDLE_CONNS`
  * The maximum number of idle connections Harbor should leave open to the postgresql server
  * The default value is `50`
* `POSTGRESQL_MAX_OPEN_CONNS`
  * The maximum number of open connections Harbor should have to the postgresql server
  * The default value is `100`
* `CORE_URL`
  * The URL that harbor-core should publish to other Harbor services in order for them to connect to the harbor-core service
  * The default value is `http://harbor-core:8080`
* `JOBSERVICE_URL`
  * The URL that harbor-core should use to connect to the harbor-jobservice service
  * The default value is `http://harbor-jobservice:8080`
* `REGISTRY_URL`
  * The URL that harbor-core should use to connect to the harborregistry service.
  * The default value is `http://harborregistry:5000`
* `TOKEN_SERVICE_URL`
  * The URL that the harbor-core service publishes to other services in order to retrieve a JWT token
  * The default value is `http://harbor-core:8080/service/token`
* `WITH_NOTARY`
  * Tells harbor-core if the notary service is being used. This service is not used with Lagoon's implementation of Harbor.
  * The default value is `false`
* `CFG_EXPIRATION`
  * This value is not used
  * The default value is `5`
* `ADMIRAL_URL`
  * Tells harbor-core where to find the admiral service. This service is not used with Lagoon's implementation of Harbor.
  * The default value is `NA`
* `WITH_CLAIR`
  * Tells harbor-core if the clair service is being used. This service is used with Lagoon's implementation of Harbor.
  * The default value is `true`
* `CLAIR_DB_HOST`
  * Tells harbor-core where to find the harborclair service.
  * The default value is `harbor-database`
* `CLAIR_DB_PORT`
  * The port Harbor should use to connect to the clair server
  * The default value is `5432`
* `CLAIR_DB_USERNAME`
  * The user Harbor should use to connect to the postgresql server
  * The default value is `postgres`
* `CLAIR_DB`
  * The database type clair should use
  * The default value is `postgres`
* `CLAIR_DB_SSLMODE`
  * Whether or not harborclair should use SSL to connect to the postgresql server
  * The default value is `disable`
* `CLAIR_URL`
  * The URL that harbor-core should use to connect to the harborclair service
  * The default value is `http://harborclair:6060`
* `CLAIR_ADAPTER_URL`
  * The URL that harbor-core should use to connect to the harborclairadapter service
  * The default value is `http://harborclairadapter:8080`
* `REGISTRY_STORAGE_PROVIDER_NAME`
  * The storage backend that harborregistry should use
  * The default value is `s3`
* `WITH_CHARTMUSEUM`
  * Tells harbor-core if the chartmuseum service is being used. This service is not used with Lagoon's implementation of Harbor.
  * The default value is `false`
* `LOG_LEVEL`
  * The default log level of the harborcore service
  * The default value is `error`
* `CONFIG_PATH`
  * Where harborcore should look for its config file
  * The default value is `/etc/core/app.conf`
* `SYNC_REGISTRY`
  * This value is not used.
  * The default value is `false`
* `CHART_CACHE_DRIVER`
  * Tells harborcore where to store any uploaded charts
  * The default value is `redis`
* `_REDIS_URL`
  * Tells harborcore and the chartmuseum service connection info for the redis server
  * The default value is `harbor-redis:6379,100,`
* `_REDIS_URL_REG`
  * The url which harborregistry should use to connect to the redis server
  * The default value is `redis://harbor-redis:6379/2`
* `PORTAL_URL`
  * This value tells the service where to connect to the Harbor-Portal service.
  * The default value is set to `http://harbor-portal:8080`
* `REGISTRYCTL_URL`
  * This value tells the service where to connect to the HarborRegistryCtl service.
  * The default value is set to `http://harborregistryctl:8080`
      - CLAIR_HEALTH_CHECK_SERVER_URL=http://harborclair:6061
* `HTTP_PROXY`
  * The default value is an empty string.
* `HTTPS_PROXY`
  * The default value is an empty string.
* `NO_PROXY`
  * A list of hosts which should never have their requests proxied.
  * The default is `harbor-core,harbor-jobservice,harbor-database,harborclair,harborclairadapter,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`
* `HARBOR_NGINX_ENDPOINT`
  * This environment variable tells HarborRegistry where its nginx ingress controller, Harbor-Nginx, is running in order to construct proper push and pull instructions in the UI, among other things.
  * The default value is set to `http://harbor-nginx:8080` when ran locally or during CI testing.
  * Lagoon attempts to obtain and set this variable automagically when ran in production. If that process fails, this service will fail to run.
* `ROBOT_TOKEN_DURATION`
  * This values sets how many days each issues robot token should be valid for.
  * The default value is set to `999`
* `CORE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Core
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `JOBSERVICE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Jobservice
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `REGISTRY_HTTP_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to HarborRegistry
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `HARBOR_ADMIN_PASSWORD`
  * The password which should be used to access harbor using the `admin` user.
  * The default value is `admin` when ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `CLAIR_DB_PASSWORD`
  * The password used to access HarborClair's postgres database.
  * The default value is `test123` when ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.


## Harbor-Database Settings
Harbor-Database requires specific environment variables to be set in order to start, which are stored within secrets as described in the `services/harbor-database/harbor-core.yml` file.

* `POSTGRES_PASSWORD`
  * The root password for the postgres database.
  * The default value is `test123`
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon
* `POSTGRES_USER`
  * The default user to be setup when initalizing the postgres service.
  * The default value is `postgres`
* `POSTGRES_DB`
  * The default database to be setup when initalizing the postgres service.
  * The default value is `postgres`

## Harbor-Jobservice Settings
Harbor-Jobservice requires a configuration file to start, which is located at `/etc/jobservice/config.yml` within the container. This config file is stored within the `services/harbor-jobservice/harbor-core.yml` file.

* `CORE_URL`
  * This value tells HarborClairAdapter where Harbor-Core can be reached.
  * The default value is `http://harbor-core:8080`
* `CORE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Core
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `JOBSERVICE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Jobservice
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `REGISTRY_CONTROLLER_URL`
  * This value tells the service where to connect to the HarborRegistryCtl service.
  * The default value is set to `http://harborregistryctl:8080`
* `LOG_LEVEL`
  * The logging level this service should use
  * The default value is `error`
    * This can also be set to `debug` to enable very verbose logging.
* `HTTP_PROXY`
  * The default value is an empty string.
* `HTTPS_PROXY`
  * The default value is an empty string.
* `NO_PROXY`
  * A list of hosts which should never have their requests proxied.
  * The default is `harbor-core,harbor-jobservice,harbor-database,harborclair,harborclairadapter,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`
* `SCANNER_CLAIR_DATABASE_URL`
  * This value tells HarborClair how to connect to its postgres database.
  * The default value is `postgres://postgres:test123@harbor-database:5432/postgres?sslmode=disable` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon, as the postgres password needs to be injected here.
* `SCANNER_STORE_REDIS_URL`
  * This value tells HarborClair how to connect to its redis store.
  * The default value is `redis://harbor-redis:6379/4`
* `SCANNER_LOG_LEVEL`
  * The logging level the scanning service should use
  * The default value is `error`
    * This can also be set to `debug` to enable very verbose logging.

## Harbor-Nginx Settings
No specific configuration is needed for Harbor-Nginx.

## Harbor-Portal Settings
No specific configuration is needed for Harbor-Portal.

## Harbor-Redis Settings
No specific configuration is needed for Harbor-Redis.

## HarborClair Settings
HarborClair requires a configuration file to start, which is located at `/etc/clair/config.yaml` within the container. This config file is stored within the `services/harborclair/harbor-core.yml` file.

* `CLAIR_DB_PASSWORD`
  * The password used to access HarborClair's postgres database.
  * The default value is `test123` when ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `HTTP_PROXY`
  * The default value is an empty string.
* `HTTPS_PROXY`
  * The default value is an empty string.
* `NO_PROXY`
  * A list of hosts which should never have their requests proxied.
  * The default is `harbor-core,harbor-jobservice,harbor-database,harborclair,harborclairadapter,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`
* `SCANNER_CLAIR_DATABASE_URL`
  * This value tells HarborClair how to connect to its postgres database.
  * The default value is `postgres://postgres:test123@harbor-database:5432/postgres?sslmode=disable` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon, as the postgres password needs to be injected here.
* `SCANNER_STORE_REDIS_URL`
  * This value tells HarborClair how to connect to its redis store.
  * The default value is `redis://harbor-redis:6379/4`
* `SCANNER_LOG_LEVEL`
  * The logging level this service should use
  * The default value is `error`
    * This can also be set to `debug` to enable very verbose logging.

## HarborClairAdapter Settings
HarborClairAdapter requires specific environment variables to be set in order to start, which are stored within secrets as described in the `services/harborclairadapter/harborclair.yml` file.

* `CORE_URL`
  * This value tells HarborClairAdapter where Harbor-Core can be reached.
  * The default value is `http://harbor-core:8080`
* `SCANNER_CLAIR_URL`
  * This value tells HarborClairAdapter where it can be reached by other containers and/or services.
  * The default value is `http://harborclair:6060`
* `SCANNER_CLAIR_DATABASE_URL`
  * This value tells HarborClairAdapter how to connect to HarborClair's postgres database.
  * The default value is `postgres://postgres:test123@harbor-database:5432/postgres?sslmode=disable` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon, as the postgres password needs to be injected here.
* `SCANNER_STORE_REDIS_URL`
  * This value tells HarborClairAdapter how to connect to HarborClair's redis store.
  * The default value is `redis://harbor-redis:6379/4`
* `SCANNER_LOG_LEVEL`
  * The logging level this service should use
  * The default value is `error`
    * This can also be set to `debug` to enable very verbose logging.

## HarborRegistry Settings
HarborRegistry requires a configuration file to start, which is located at `/etc/registry/config.yml` within the container. This config file is stored within the `services/harborregistry/harborregistry.yml` file and loaded into the container as `/etc/registry/pre-config.yml`. A custom container entrypoint, `services/harborregistry/entrypoint.sh`, then transposes provided envrionment variables into this config file and saves the results as `/etc/registry/config.yml`.

* `HARBOR_NGINX_ENDPOINT`
  * This environment variable tells HarborRegistry where its nginx ingress controller, Harbor-Nginx, is running in order to construct proper push and pull instructions in the UI, among other things.
  * The default value is set to `http://harbor-nginx:8080` when ran locally or during CI testing.
  * Lagoon attempts to obtain and set this variable automagically when ran in production. If that process fails, this service will fail to run.
* `REGISTRY_REDIS_PASSWORD`
  * This environment variable tells HarborRegistryCtl the password that should be used to connect to Redis
  * The default value is an empty string
* `CORE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Core
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing. 
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `JOBSERVICE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Jobservice
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `REGISTRY_HTTP_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to HarborRegistry
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.

## HarborRegistryCtl Settings
HarborRegistryCtl requires a configuration file to start, which is located at `/etc/registryctl/config.yml` within the container. This config file is stored within the `services/harborregistryctl/harborregistry.yml` file.

* `REGISTRY_REDIS_PASSWORD`
  * This environment variable tells HarborRegistryCtl the password that should be used to connect to Redis
  * The default value is an empty string
* `CORE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Core
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `JOBSERVICE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Jobservice
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `REGISTRY_HTTP_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to HarborRegistry
  * The default value is set to `secret123` when Harbor is ran locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.