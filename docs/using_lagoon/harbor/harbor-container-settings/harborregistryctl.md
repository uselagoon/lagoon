# HarborRegistryCtl Settings
HarborRegistryCtl requires a configuration file to start, which is located at `/etc/registryctl/config.yml` within the container. This config file is stored within the `services/harborregistryctl/harborregistry.yml` file.

## Config File Contents

* `CORE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Core.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `JOBSERVICE_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to Harbor-Jobservice.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `REGISTRY_HTTP_SECRET`
  * This value is a pre-shared key that must match between the various services connecting to HarborRegistry.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retreived from a secret created when Harbor is first setup on a running Lagoon.
* `REGISTRY_REDIS_PASSWORD`
  * This environment variable tells HarborRegistryCtl the password that should be used to connect to Redis.
  * The default value is an empty string.