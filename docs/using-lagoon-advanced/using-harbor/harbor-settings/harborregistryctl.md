# HarborRegistryCtl

HarborRegistryCtl requires a configuration file to start, which is located at `/etc/registryctl/config.yml` within the container. Any changes made to this config file are temporary and will not persist once the pod is restarted.

The configmap from which this config file is generated is stored within Lagoon in the `services/harborregistryctl/harborregistry.yml` file. Any changes made to this configmap will be persisted across container restarts.

## Config File Contents

* **`CORE_SECRET`**
  * This value is a pre-shared key that must match between the various services connecting to `harbor-core`.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`JOBSERVICE_SECRET`**
  * This value is a pre-shared key that must match between the various services connecting to `harbor-jobservice`.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`REGISTRY_HTTP_SECRET`**
  * This value is a pre-shared key that must match between the various services connecting to `harborregistry`.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`REGISTRY_REDIS_PASSWORD`**
  * This environment variable tells `harborregistryctl` the password that should be used to connect to Redis.
  * The default value is an empty string.
