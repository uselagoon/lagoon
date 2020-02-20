# Running Harbor Locally
Lagoon supports running Harbor locally, and it is automatically used for hosting all kubernetes based builds (any time the project's `activeSystemsDeploy` value is set to `lagoon_kubernetesBuildDeploy`).

# Settings
Harbor is composed of multiple containers, which all require different specific vairables to be set in order for them to run successfully. The following variables are required to be set in order for Harbor to properly start:

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

## Harbor-Core Settings
- DATABASE_TYPE=postgresql
      - POSTGRESQL_HOST=harbor-database
      - POSTGRESQL_PORT=5432
      - POSTGRESQL_USERNAME=postgres
      - POSTGRESQL_PASSWORD=test123
      - POSTGRESQL_DATABASE=registry
      - POSTGRESQL_SSLMODE=disable
      - POSTGRESQL_MAX_IDLE_CONNS=50
      - POSTGRESQL_MAX_OPEN_CONNS=100
      - CORE_URL=http://harbor-core:8080
      - JOBSERVICE_URL=http://harbor-jobservice:8080
      - REGISTRY_URL=http://harborregistry:5000
      - TOKEN_SERVICE_URL=http://harbor-core:8080/service/token
      - WITH_NOTARY=false
      - CFG_EXPIRATION=5
      - ADMIRAL_URL=NA
      - WITH_CLAIR=true
      - CLAIR_DB_HOST=harbor-database
      - CLAIR_DB_PORT=5432
      - CLAIR_DB_USERNAME=postgres
      - CLAIR_DB=postgres
      - CLAIR_DB_SSLMODE=disable
      - CLAIR_URL=http://harborclair:6060
      - CLAIR_ADAPTER_URL=http://harborclairadapter:8080
      - REGISTRY_STORAGE_PROVIDER_NAME=s3
      - WITH_CHARTMUSEUM=false
      - LOG_LEVEL=error
      - CONFIG_PATH=/etc/core/app.conf
      - SYNC_REGISTRY=false
      - CHART_CACHE_DRIVER=redis
      - _REDIS_URL=harbor-redis:6379,100,
      - _REDIS_URL_REG=redis://harbor-redis:6379/2
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