# Developing Lagoon

Development of Lagoon locally can now be performed on a local Kubernetes cluster, or via Docker Compose \(as a fallback\).

!!! Note
    The full Lagoon stack relies on a range of upstream projects which are currently incompatible with ARM-based architectures, such as the the M1/M2 Apple Silicon-based machines. For this reason, running or developing `lagoon-core` or `lagoon-remote` locally on these architectures is not currently supported. See https://github.com/uselagoon/lagoon/issues/3189 for more information.

## Required command line tools

Some tools are required that are not downloaded/linked by the makefile, some systems may have these installed already.

* `envsubst`
* `wget`

Mac users can install these via brew:

```
brew install wget gettext
```

## Docker

Docker must be installed to build and run Lagoon locally.

### Install Docker and Docker Compose

Please check the [official docs](https://docs.docker.com/engine/installation/) for how to install Docker.

Docker Compose is included in Docker for Mac installations. For Linux installations [see the directions here](https://docs.docker.com/compose/install/).

### Configure Docker

You will need to update your insecure registries in Docker. [Read the instructions here on how to do that](https://docs.docker.com/registry/insecure/). We suggest adding the entire local IPv4 Private Address Spaces to avoid unnecessary reconfiguration between Kubernetes and Docker Compose. e.g. `"insecure-registries" : ["172.16.0.0/12","192.168.0.0/16"],`

### Allocate Enough Docker Resources

Running a Lagoon, Kubernetes, or Docker cluster on your local machine consumes a lot of resources. We recommend that you give your Docker host a minimum of 8 CPU cores and 12GB RAM.

### MacOS Docker Networking

Unfortunately Docker for Mac runs Docker inside a lightweight VM. This makes some of the functionality that Linux users enjoy, unusable in MacOS. That functionality is the ability to route to container IP addresses within the docker networks directly. On MacOS this is not possible out of the box.

You can install the following package https://github.com/chipmk/docker-mac-net-connect. What this software does is create a tunnel between the Docker VM and the host and creates routes for the internal docker networks to the host. This allows you to access the Lagoon services in the docker network that is exposed inside of k3d the same way users developing on Linux would.

```
# Install via Homebrew
$ brew install chipmk/tap/docker-mac-net-connect
# Run the service and register it to launch at boot
$ sudo brew services start chipmk/tap/docker-mac-net-connect
# Stop the service
$ sudo brew services stop chipmk/tap/docker-mac-net-connect
```

## Build Lagoon Locally

!!! warning
    Only consider building Lagoon this way if you intend to develop features or functionality for it, or want to debug internal processes. We will also be providing instruction to install Lagoon without building it \(i.e. by using the published releases\).

We're using `make` \(see the [Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile)\) in order to build the needed Docker images, configure Kubernetes and run tests.

We have provided a number of routines in the [Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile) to cover most local development scenarios. Here we will run through a complete process.

### Build images

1. Here `-j8` tells **make** to run 8 tasks in parallel to speed the build up. Adjust as necessary.
2. We have set `SCAN_IMAGES=false` as a default to not scan the built images for vulnerabilities. If set to true, a `scan.txt` file will be created in the project root with the scan output.

```bash title="Build images"
make -j8 build
```

### Deploy a local Lagoon development stack without test suites

The make file offers a command that allows you to spin up Lagoon inside of a k3d cluster locally and explore its functionality.

Using the following make command will create a k3d cluster and install any dependencies (ingress, harbor, s3 compatible storage, etc) that are required by Lagoon. It will then build any images required and push them to the registry, and install `lagoon-core`, `lagoon-remote`, and `lagoon-build-deploy` charts.

```bash title="Deploy local stack"
make k3d/local-stack
```

!!! warning
    Once you have a running `make k3d/local-stack` you should not run it again. There are other targets that can be run safely after the initial stack is running.

At the end of the process, the command will provide some useful information that will help to get you up and running and able to log in to the UI or using the API with tools like the Lagoon CLI.

!!! warning
    This can take some time to complete as it will install a lot of components necessary to make Lagoon work. This includes things like ingress-nginx, harbor, and all the additional services to make exploring Lagoon easy.


### Local stack setup options

There are a number of variables that can be used with `make k3d/local-stack` that can enable or disable certain options when setting up the initial cluster.

#### DBaaS providers

There are some Database as a Service (DBaaS) providers that are installed by default, to speed up time with a local stack, or for compatability reasons, you can disable them individually.

```bash title="Deploy local stack without specific provider"
# disable all of them
make k3d/local-stack INSTALL_DBAAS_PROVIDERS=false

# just disable mongodb
make k3d/local-stack INSTALL_MONGODB_PROVIDER=false
# just disable mariadb
make k3d/local-stack INSTALL_MARIADB_PROVIDER=false
# just disable postgres
make k3d/local-stack INSTALL_POSTGRES_PROVIDER=false
# other combinations as needed
make k3d/local-stack INSTALL_POSTGRES_PROVIDER=false  INSTALL_MONGODB_PROVIDER=false
```

!!! info
    If you're using an arm64 based operating system (MacOS M* for example), then `INSTALL_MONGODB_PROVIDER` will always be set to `false`, this is because there are some issues due to MongoDB not working properly.

#### Stable chart installation and upgrading chart versions

It is possible to run the local-stack as it would be directly from a stable chart version.

This can be useful if you want to get a Lagoon up and running without having to build all the service images.

Using this feature also allows for upgrading from a stable chart version to a feature chart.

##### All stable components

This will install lagoon-core, lagoon-remote, and lagoon-build-deploy charts with their current stable versions

```bash title="Deploy local stack with stable core, remote, build-deploy"
make k3d/stable-local-stack

# which is a shorter target for
make k3d/local-stack INSTALL_STABLE_LAGOON=true
```

##### Specific stable components

It's also possible to selectively install certain components with a stable version. Anything not set to `true` will install the version from the charts repository.

```bash title="Deploy local stack with stable versions"
make k3d/local-stack INSTALL_STABLE_CORE=true
make k3d/local-stack INSTALL_STABLE_REMOTE=true
make k3d/local-stack INSTALL_STABLE_BUILDDEPLOY=true
```

### Upgrading Lagoon components only

Once you have a `k3d/local-stack` running, if you need to re-run the Lagoon installation to test an upgrade you can use the following target.

```bash title="Install or upgrade all Lagoon components"
make k3d/install-lagoon

# or shortcut to a stable lagoon
make k3d/stable-install-lagoon
# which is a shorter target for
make k3d/install-lagoon INSTALL_STABLE_LAGOON=true
```

This can be used if you started an initial `local-stack` with stable chart versions. Running this without any of the `INSTALL_STABLE_X` flags, will build and install Lagoon with the versions of images in the current `uselagoon/lagoon` branch, and install using the charts from the repository listed under `CHARTS_REPOSITORY` and `CHARTS_TREEISH`.

You can also retain any stable versions of other components if you wish, for example only installing the bleeding edge lagoon-core. This can be used to verify an upgrade path from a stable chart

```bash title="Install all stable then upgrade Lagoon core only"
# install a local stack with all stable components
make k3d/local-stack INSTALL_STABLE_LAGOON=true

# optionally checkout a new version of the charts branch if there are changes made
make k3d/checkout-charts

# make changes to a lagoon service or the lagoon-core charts and re-install lagoon
make k3d/install-lagoon INSTALL_STABLE_REMOTE=true INSTALL_STABLE_BUILDDEPLOY=true
```

!!! warning
    The upstream charts `CHARTS_REPOSITORY` and `CHARTS_TREEISH` are only checked out when the cluster is first created and installed.
    If you make changes to the charts branch, you can use `make k3d/dev` to clone and checkout the latest changes. Otherwise the existing checked out chart branch would be used. `make k3d/dev` is a short cut to `make k3d/checkout-charts` and `make k3d/install-lagoon`, which can also be used independently.

!!! warning
    Starting a `make k3d/local-stack` without any stable versions, then using `make k3d/install-lagoon` with `INSTALL_STABLE_X` flags may result in a broken Lagoon installation, however, this can be useful for verifying any downgrade or rollback paths.

#### Harbor or unauthenticated registry

Currently, Harbor does not have any arm64 based images. This means local-stack will not install Harbor on an arm64 based system. Instead an unauthenticed registry will be installed, and `lagoon-remote` will be configured to use this. This has the downsides that you won't be able to properly test any Harbor integrations on arm64 based systems for now.

If you want to skip installing Harbor entirely, even if your system is not arm based, you can use the following

```bash title="Harbor disabled
INSTALL_UNAUTHENTICATED_REGISTRY=true
```

!!! info
    There are [open issues](https://github.com/goharbor/harbor/issues/20074) in the harbor repository with people requesting support for arm, and even a [harbor-arm repository](https://github.com/goharbor/harbor-arm), which appears to be abandoned.

#### Backups / K8up

It is possible to start the local-stack with k8up support for `backup.appuio.ch/v1alpha`(v1) and `k8up.io/v1`(v2) for testing and validating that backups work, or verifying changes to backup functionality.

There are 2 make variables you can set, by default k8up is not installed.

If you wish to install k8up, you can change the following in the Makefile (or use it on every make command you run). This will install both versions of k8up into the local-stack in separate namespaces. The version that `lagoon-remote` will use is defined with a separate variable

```bash title="K8up enabled
INSTALL_K8UP=true
```

If k8up is installed, the default version that will be supported by `lagoon-remote` will be `k8up.io/v1`(v2) of k8up. This means any builds will create resources with this CRD version. You can change the version that `lagoon-remote` uses by specifying `v1` or `v2`.

```bash title="K8up version
BUILD_DEPLOY_CONTROLLER_K8UP_VERSION=v2
```

Installing k8up will also configure `lagoon-core` to start the `backup-handler` service so that the entire system works locally.

### Run the Lagoon test-suite

If you're developing new functionality in Lagoon and want to make sure the tests complete, you can run the entire test suite using the following options.

1. Start Lagoon test routine using the defaults in the Makefile \(all tests\).

```bash title="Start tests"
make k3d/test
# or use retest if you already have a local stack running
make k3d/retest
```

!!! warning
    There are a lot of tests configured to run by default - please consider only testing locally the minimum that you need to ensure functionality. This can be done by specifying or removing tests from the `TESTS` variable in the Makefile.

This process will:

1. Download the correct versions of the local development tools if not installed - `k3d`, `kubectl`, `helm`, `jq`.
2. Update the necessary Helm repositories for Lagoon to function.
3. Ensure all of the correct images have been built in the previous step.
4. Create a local K3D cluster, which provisions an entire running Kubernetes cluster in a local Docker container. This cluster has been configured to talk to a provisioned image registry that we will be pushing the built Lagoon images to. It has also been configured to allow access to the host filesystem for local development.
5. Clone Lagoon from [https://github.com/uselagoon/lagoon-charts](https://github.com/uselagoon/lagoon-charts) \(use the `CHARTS_TREEISH` variable in the Makefile to control which branch if needed\).
6. Install the Harbor Image registry into the K3D cluster and configure its ingress and access properly.
7. Docker will push the built images for Lagoon into the Harbor image registry.
8. It then uses the [Makefile from lagoon-charts](https://github.com/uselagoon/lagoon-charts/blob/main/Makefile) to perform the rest of the setup steps.
9. A suitable ingress controller is installed - we use the [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/).
10. A local NFS server provisioner is installed to handle specific volume requests - we use one that handles Read-Write-Many operations \(RWX\).
11. Lagoon Core is then installed, using the locally built images pushed to the cluster-local Image Registry, and using the default configuration, which may exclude some services not needed for local testing. The installation will wait for the API and Keycloak to come online.
12. The DBaaS providers are installed - MariaDB, PostgreSQL and MongoDB. This step provisions standalone databases to be used by projects running locally, and emulates the managed services available via cloud providers \(e.g. Cloud SQL, RDS or Azure Database\).
13. Lagoon Remote is then installed, and configured to talk to the Lagoon Core, databases and local storage. The installation will wait for this to complete before continuing.
14. To provision the tests, the Lagoon Test chart is then installed, which provisions a local Git server to host the test repositories, and pre-configures the Lagoon API database with the default test users, accounts and configuration. It then performs readiness checks before starting tests.
15. Lagoon will run all the tests specified in the TESTS variable in the Makefile. Each test creates its own project & environments, performs the tests, and then removes the environments & projects. The test runs are output to the console log in the `lagoon-test-suite-*` pod, and can be accessed one test per container.

Ideally, all of the tests pass and it's all done!

### View the test progress and your local cluster

The test routine creates a local Kubeconfig file \(called `kubeconfig.k3d.lagoon` in the root of the project, that can be used with a Kubernetes dashboard, viewer or CLI tool to access the local cluster. We use tools like [Lens](https://k8slens.dev/), [Octant](https://octant.dev/), [kubectl](https://kubernetes.io/docs/reference/kubectl/cheatsheet/) or [Portainer](https://www.portainer.io/) in our workflows. Lagoon Core and the tests build in the `lagoon-core` namespace, Remote is installed in the `Lagoon` namespace. Each lagoon test environment creates its own namespace to run, so make sure to use the correct context when inspecting.

In order to use kubectl with the local cluster, you will need to use the correct Kubeconfig. This can be done for every command or it can be added to your preferred tool:

```bash title="kubeconfig.k3d.lagoon"
KUBECONFIG=./kubeconfig.k3d.lagoon kubectl get pods -n lagoon
```

The Helm charts used to build the local Lagoon are cloned into a local folder and symlinked to `lagoon-charts.k3d.lagoon` where you can see the configuration. We'll cover how to make easy modifications later in this documentation.

### Interact with your local Lagoon cluster

The Makefile includes a few simple routines that will make interacting with the installed Lagoon simpler:

#### Port forwarding

Clusters deployed by this makefile will provide loadbalancers and individual IPs, but if you choose to you can port-forward some services using the following

```bash title="Create local ports"
make k3d/port-forwards
```

This will create local ports to expose the UI \(6060\), API \(7070\) and Keycloak \(8080\). Note that this logs to `stdout`, so it should be performed in a secondary terminal/window.

#### Lagoon credentials/information

This will retrieve the necessary credentials to interact with the Lagoon.

```bash title="Retrieve admin creds"
make k3d/get-lagoon-details
```

* The JWT is an admin-scoped token for use as a bearer token with your local GraphQL client. [See more in our GraphQL documentation](../interacting/graphql.md).
* There is a token for use with the "admin" user in Keycloak, who can access all users, groups, roles, etc.

It is also possible to get the command snippet to add the configuration for the local-stack to your lagoon-cli.

```bash title="Retrieve admin creds"
make k3d/get-lagoon-cli-details
```

#### Rebuild Lagoon core and push images

This will checkout `CHARTS_REPOSITORY` and `CHARTS_TREEISH` again, then build and re-push the images listed in `KIND_SERVICES` with the correct tag, and redeploy the lagoon charts. This is useful for testing small changes to Lagoon services, but does not support "live" development. You will need to rebuild these images locally first, e.g `rm build/api && make build/api`.

```bash title="Re-push images"
make k3d/dev
```

#### Patch with local node.js

This will build the typescript services, using your locally installed Node.js \(it should be &gt;16.0\). It will then:

```bash title="Build typescript services"
make k3d/local-dev-patch
```


* Mount the "dist" folders from the Lagoon services into the correct lagoon-core pods in Kubernetes
* Redeploy the lagoon-core chart with the services running with `nodemon`watching the code for changes
* This will facilitate "live" development on Lagoon.
* Note that occasionally the pod in Kubernetes may require redeployment for a change to show. Clean any build artifacts from those services if you're rebuilding different branches with `git clean -dfx` as the dist folders are ignored by Git.

#### Install simple Logging support

This will create a standalone OpenDistro for Elasticsearch cluster in your local Docker, and configure Lagoon to dispatch all logs \(Lagoon and project\) to it, using the configuration in [lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging).

```bash title="Initiate logging"
make k3d/local-dev-logging
```

#### Re run specific tests

This will re-run a suite of tests \(defined in the `TESTS` variable\) against the existing cluster. It will re-push the images needed for tests \(tests, local-git, and the data-watcher-pusher\). You can specify tests to run by passing the TESTS variable inline.

```bash title="Re-run tests."
make k3d/retest
# OR
make k3d/retest TESTS='[features-kubernetes]'
```

If updating a test configuration, the tests image will need to be rebuilt and pushed, e.g `rm build/tests && make build/tests && make k3d/push-images IMAGES='tests' && make k3d/retest TESTS='[api]'`

#### Push images

This will push all the images up to the image registry. Specifying `IMAGES` will tag and push specific images.

```bash title="Push all images"
make k3d/push-images
# OR
make k3d/push-images IMAGES='tests local-git'
```

#### Tear down

This will remove the K3D Lagoon cluster from your local Docker.

```bash title="Remove cluster"
make k3d/clean
```

##### Additional cleanup commands

There could be a number of old resources hanging around after you've run the stack a few times, you can use the following to clean up further.

```bash title="Cleanup commands"
# remove any unused generated kubeconfigs
make k3d/clean-k3dconfigs

# remove any unused cloned chart directories
make k3d/clean-charts

# combination of tear down, remove any unused cloned chart directories, and unused generated kubeconfigs
make k3d/clean-all
```

### Ansible

The Lagoon test uses Ansible to run the test suite. Each range of tests for a specific function has been split into its own routine. If you are performing development work locally, select which tests to run, and update the `$TESTS` variable in the Makefile to reduce the concurrent tests running.

The configuration for these tests is held in three services:

* `tests` is the Ansible test services themselves.  The local testing routine runs each individual test as a separate container within a test-suite pod.  These are listed below.
* `local-git` is a Git server hosted in the cluster that holds the source files for the tests.  Ansible pulls and pushes to this repository throughout the tests
* `api-data-watcher-pusher` is a set of GraphQL mutations that pre-populates local Lagoon with the necessary Kubernetes configuration, test user accounts and SSH keys, and the necessary groups and notifications.  **Note that this will wipe local projects and environments on each run.**

The individual routines relevant to Kubernetes are:

* `active-standby-kubernetes` runs tests to check active/standby in Kubernetes.
* `api` runs tests for the API - branch/PR deployment, promotion.
* `bitbucket`, `gitlab` and `github` run tests for the specific SCM providers.
* `drupal-php74` runs a single-pod MariaDB, MariaDB DBaaS and a Drush-specific test for a Drupal 8/9 project \(`drupal-php73` doesn't do the Drush test\).
* `drupal-postgres` runs a single-pod PostgreSQL and a PostgreSQL DBaaS test for a Drupal 8 project.
* `elasticsearch` runs a simple NGINX proxy to an Elasticsearch single-pod.
* `features-variables` runs tests that utilize variables in Lagoon.
* `features-kubernetes` runs a range of standard Lagoon tests, specific to Kubernetes.
* `features-kubernetes-2` runs more advanced kubernetes-specific tests - covering multi-project and subfolder configurations.
* `nginx`, `node` and `python` run basic tests against those project types.
* `node-mongodb` runs a single-pod MongoDB test and a MongoDB DBaaS test against a Node.js app.

## Local Development

Most services are written in [Node.js](https://nodejs.org/en/docs/). As many of these services share similar Node.js code and Node.js packages, we're using a feature of [Yarn](https://yarnpkg.com/en/docs), called [Yarn workspaces](https://yarnpkg.com/en/docs/workspaces). Yarn workspaces need a `package.json` in the project's root directory that defines the workspaces.

The development of the services can happen directly within Docker. Each container for each service is set up in a way that its source code is mounted into the running container \([see `docker-compose.yml`](../concepts-basics/docker-compose-yml.md)\). Node.js itself is watching the code via `nodemon` , and restarts the Node.js process automatically on a change.

### lagoon-commons

The services not only share many Node.js packages, but also share actual custom code. This code is within `node-packages/lagoon-commons`. It will be automatically symlinked by Yarn workspaces. Additionally, the [`nodemon`](https://www.npmjs.com/package/nodemon) of the services is set up in a way that it checks for changes in `node-packages` and will restart the node process automatically.

## Troubleshooting

### I can't build a Docker image for any Node.js based service

Rebuild the images via:

```bash title="Rebuild images"
    make clean
    make build
```

### I get errors about missing `node_modules` content when I try to build / run a Node.js based image

Make sure to run `yarn` in Lagoon's root directory, since some services have common dependencies managed by `yarn` workspaces.

### I get an error resolving the `nip.io` domains

```text title="Error"
Error response from daemon: Get https://registry.172.18.0.2.nip.io/v2/: dial tcp: lookup registry.172.18.0.2.nip.io: no such host
```

This can happen if your local resolver filters private IPs from results. You can work around this by editing `/etc/resolv.conf` and adding a line like `nameserver 8.8.8.8` at the top to use a public resolver that doesn't filter results.

### I want to be able to test email in a demo environment using the lagoon built in ssmtp configuration entrypoints

This k3d cluster installs a mail catching service that is available at `mxout.lagoon.svc:25` within the cluster (it also has a web interface `make k3d/get-lagoon-details` for details). Some images in lagoon support `SSMTP_MAILHUB` variable, which can be added to a project using the lagoon-cli, or the following graphql via the API.

```
addOrUpdateEnvVariableByName(
    input: {
        project: "lagoon-demo"
        scope: RUNTIME
        name: "SSMTP_MAILHUB"
        value: "mxout.lagoon.svc:25"
    }
) {
    id
}
```

## Example workflows

Here are some development scenarios and useful workflows for getting things done.

### Add tests

An example

1. Deploy the lagoon and run the test you're modifying.

```bash title="Deploy Lagoon"
make k3d/test TESTS=[features-variables]
```

2. Edit `tests/tests/features-variables.yaml` and add a test case.
3. Rebuild the `tests` image.

```bash title="Build tests"
rm build/tests
make -j8 build/tests
```

1. Push the new `tests` image into the cluster registry.

```bash title="Push test image"
make k3d/push-images IMAGES=tests
```

1. Rerun the tests.

```bash title="Re-run tests"
make k3d/retest TESTS=[features-variables]
```

### k3d internal DNS cluster service resolution issues

If you encounter an issue whe running a local-stack that seems to indicate that the cluster can't resolve an internal service within the cluster, you may need to run
```bash title="br_netfilter"
sudo modprobe br_netfilter
```

### k3d containers reporting too many open files

You may need to bump `fs.inotify.max_user_instances` and `fs.inotify.max_user_watches`

```bash title="sysctl"
sudo sysctl fs.inotify.max_user_instances=8192
sudo sysctl fs.inotify.max_user_watches=524288
```
