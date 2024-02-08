# Harbor-Jobservice

Harbor-Jobservice requires a configuration file to start, which is located at `/etc/jobservice/config.yml` within the container. Any changes made to this config file are temporary and will not persist once the pod is restarted.

The configmap from which this config file is generated is stored within Lagoon in the `services/harbor-jobservice/harbor-jobservice.yml` file. Any changes made to this configmap will be persisted across container restarts.

## Config File Contents

* **`CORE_URL`**
  * This value tells `harbor-jobservice` where `harbor-core` can be reached.
  * The default value is `http://harbor-core:8080`.
* **`CORE_SECRET`**
  * This value is a pre-shared key that must match between the various services connecting to `harbor-core`.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`HTTP_PROXY`**
  * The default value is an empty string.
* **`HTTPS_PROXY`**
  * The default value is an empty string.
* **`JOBSERVICE_SECRET`**
  * This value is a pre-shared key that must match between the various services connecting to `harbor-jobservice`.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`LOG_LEVEL`**
  * The logging level this service should use.
  * The default value is `error`.
    * This can also be set to `debug` to enable very verbose logging.
* **`NO_PROXY`**
  * A list of hosts which should never have their requests proxied.
  * The default is `harbor-core,harbor-jobservice,harbor-database,harbor-trivy,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`.
* **`REGISTRY_CONTROLLER_URL`**
  * This value tells the service where to connect to the `harborregistryctl` service.
  * The default value is set to `http://harborregistryctl:8080`
* **`SCANNER_LOG_LEVEL`**
  * The logging level the scanning service should use.
  * The default value is `error`.
    * This can also be set to `debug` to enable very verbose logging.
* **`SCANNER_STORE_REDIS_URL`**
  * This value tells `harbor-trivy` how to connect to its Redis store.
  * The default value is `redis://harbor-redis:6379/4`.
