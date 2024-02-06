# Environment Idling (optional)

## What is the Environment Idler?

Lagoon can utilize the [Aergia controller](https://github.com/amazeeio/aergia-controller), (installed in the `lagoon-remote`) to automatically idle environments if they have been unused for a defined period of time. This is done in order to reduce the load on the Kubernetes clusters and improve the overall performance of production environments and development environments that are actually in use.

### How does an environment get idled?

The environment idler has many different configuration capabilities. Here are the defaults of a standard Lagoon installation \(these could be quite different in your Lagoon, check with your Lagoon administrator!\)

* Idling is tried every 4 hours.
* Production environments are never idled.
* CLI pods are idled if they don't include a cron job and if there is no remote shell connection active.
* All other services and pods are idled if there was no traffic on the environment in the last 4 hours.
* If there is an active build happening, there will be no idling.

### How does an environment get un-idled?

Aergia will automatically un-idle an environment as soon as it is visited, therefore just visiting any URL of the environment will start the environment. Likewise, initiating an SSH session to the environment will also restart the services.

The un-idling will take a couple of seconds, as the Kubernetes cluster needs to start all containers again. During this time there will be waiting screen shown to the visitor that their environment is currently started.

### Can I disable / prevent the Idler from idling my environment?

Yes, there is a field `autoIdle` on the project \(impacts all environments\) and environment \(if you need to target just one environment\), as to whether idling is allowed to take place. A value of `1` indicates the project/environment is eligible for idling. If the project is set to `0` the environments will never be idled, even if the environment is set to `0`
The default is always `1`\(idling is enabled\).

Talk to your Lagoon administrator if you are unsure how to set these project/environment fields.
