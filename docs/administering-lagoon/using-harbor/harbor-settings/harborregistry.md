# HarborRegistry

HarborRegistry requires a configuration file to start, which is located at `/etc/registry/config.yml` within the container. Any changes made to this config file are temporary and will not persist once the pod is restarted.

This config file is stored within the `services/harborregistry/harborregistry.yml` file and loaded into the container as `/etc/registry/pre-config.yml`.

A custom container entrypoint, `services/harborregistry/entrypoint.sh`, then transposes provided environment variables into this config file and saves the results as `/etc/registry/config.yml`.

## Config File Contents

* **`CORE_SECRET`**
  * This value is a pre-shared key that must match between the various services connecting to `harbor-core`.
  * The default value is set to `secret123` when Harbor is run locally or during CI testing.
  * This value is retrieved from a secret created when Harbor is first set up on a running Lagoon.
* **`HARBOR_NGINX_ENDPOINT`**
  * This environment variable tells `harborregistry` where its NGINX ingress controller, `harbor-nginx`, is running in order to construct proper push and pull instructions in the UI, among other things.
  * The default value is set to `http://harbor-nginx:8080` when run locally or during CI testing.
  * Lagoon attempts to obtain and set this variable automagically when run in production. If that process fails, this service will fail to run.
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
