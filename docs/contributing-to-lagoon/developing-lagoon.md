# Developing Lagoon locally

Development of Lagoon locally can now be performed on a local Kubernetes Cluster, or via Docker Compose (as a fallback)

## Install Docker and Docker Compose

Please check the [official Docs of Docker](https://docs.docker.com/engine/installation/) for how to install Docker.

### Docker for Mac

Docker Compose is included in Docker for Mac installations.

### On Linux - Install Docker Compose

For Linux installations, [see the directions here](https://docs.docker.com/compose/install/).

### Configure Docker

You will need to update your insecure registries in Docker. [Read the instructions here on how to do that](https://docs.docker.com/registry/insecure/). We suggest adding the local IPv4 Private Address Spaces to avoid unnecessary reconfiguration between Kubernetes and Docker Compose.
e.g. ` "insecure-registries" : ["172.16.0.0/12","192.168.0.0/16"],`

### Allocate Enough Docker Resources

Running a Lagoon, Kubernetes or Docker Cluster on your local machine consumes a lot of resources. We recommend that you give your Docker host a minimum of 8 CPU cores and 12GB RAM.

## Building Lagoon Locally

{% hint style="warning" %}
Only consider building Lagoon this way if you intend to develop features or functionality for it, or want to debug internal processes. We will also be providing instruction to install Lagoon without building it (i.e. by using the published releases).

We're using `make` \(see the [Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile)\) in order to build the needed Docker images, configure Kubernetes and run tests
{% endhint %}

We have provided a number of routines in the [Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile) to cover most local development scenarios. Here we will run through a complete process.

1. Build images. Here -j8 sets make to use 8 cores parallelisation to speed the build up - adjust as necessary, and we have set SKIP_SCAN=true to not scan the built images for vulnerabilities. If set to false (or not passed), a `scan.txt` file will be created in the project root with the scan output.

```bash
make -j8 build make SKIP_SCAN=true
```

2. Start Lagoon test routine using the defaults in the makefile (all tests)

```bash
make kind/test
```

{% hint style="warning" %}
There are a lot of tests configured to run by default - please consider only testing locally the minimum that you need to ensure functionality. This is done by specifying or removing tests from the TESTS variable in the Makefile.
{% endhint %}

This process will:

1. Add in the correct versions of the local development tools if not installed - kind, kubectl, Helm, JQ
2. Update the necessary Helm repositories for Lagoon to function
3. Ensure all the correct images have been built in the previous step
4. Create a local [KinD](https://kind.sigs.k8s.io/) cluster, which provisions an entire running Kubernetes Cluster in a local Docker container. This cluster has been configured to talk to a provisioned image registry that we will be pushing the built Lagoon images to. It has also been configured to allow access to the host filesystem for local development.
5. Clone Lagoon from https://github.com/uselagoon/lagoon-charts (use the `$CHARTS_TREEISH` variable in the Makefile to control which branch if needed)
6. Install the Harbor Image registry into the KinD cluster and configure it's ingress and access properly
7. Docker push the built images for Lagoon into the Harbor image registry
8. It then uses the [Makefile from lagoon-charts](https://github.com/uselagoon/lagoon-charts/blob/main/Makefile) to perform the rest of the setup steps
9. A suitable ingress controller is installed - we use the [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
10. A local NFS server provisioner is installed to handle specific volume requests - we use one that handles Read-Write-Many operations (RWX)
11. Lagoon Core is then installed, using the locally built images pushed to the cluster-local Image Registry, and using the default configuration, which may exclude some services not needed for local testing. The installation will wait for the API and Keycloak to come online.
12. The DBaaS providers are installed - MariaDB, PostgreSQL and MongoDB. This step provisions standalone databases to be used by projects running locally, and emulates the Managed services available via cloud providers (e.g. Cloud SQL, RDS or Azure Database)
13. Lagoon Remote is then installed, and configured to talk to the Lagoon Core, Databases and local storage. The installation will wait for this to complete before continuing.
14. To provision the tests, the Lagoon Test chart is then installed, which provisions a local git server to host the test repositories, and preconfigures the Lagoon API database with the default TEST users, accounts and configuration, then performs readiness checks before starting tests.
15. Lagoon will run all the tests specified in the TESTS variable in the Makefile. Each test creates its own project & environments, performs the tests, then removes the environments & projects. The test runs are output to the console log in the lagoon-test-suite-* pod, and can be accessed one test per-container.

Hopefully, all the tests passed successfully and it's just that easy, right?

### Viewing the test progress and your local cluster

The test routine creates a local Kubeconfig file (called `kubeconfig.kind.lagoon` in the root of the project, that can be used with a Kubernetes dashboard, viewer or CLI tool to access the local cluster. We use tools like [Lens](https://k8slens.dev/), [Octant](https://octant.dev/), [kubectl](https://kubernetes.io/docs/reference/kubectl/cheatsheet/) or [Portainer](https://www.portainer.io/) in our workflows. Lagoon Core, Remote and Tests all build in the `Lagoon` namespace, and each environment creates its own namespace to run, so make sure to use the correct context when inspecting.

In order to use kubectl with the local cluster, you will need to use the correct Kubeconfig. This can be done for every command thus:

```bash
KUBECONFIG=./kubeconfig.kind.lagoon kubectl get pods -n lagoon
```
or added it to your preferred tool.

The helmfiles used to build the local Lagoon are cloned into a local folder and symlinked to `lagoon-charts.kind.lagoon` where you can see the configuration. We'll cover how to make easy modifications in a bit.

### Interacting with your local Lagoon cluster

The Makefile includes a few simple routines that will make interacting with the installed Lagoon simpler:

```bash
make kind/port-forwards
```
will create local ports to expose the UI (6060), API (7070) and Keycloak (8080). Note that this logs to stdout, so should be performed in a secondary terminal/window

```bash
make kind/get-admin-creds
```
will retrieve the necessary credentials to interact with the Lagoon.

* The JWT is an admin-scoped token for use as a bearer token with your local GraphQL client
* There is a token for use with the "admin" user in Keycloak, who can access all users, groups, roles etc
* There is also a token for use with the "lagoonadmin" user in Lagoon, which can be allocated default groups & permissions etc.

```bash
make kind/dev
```
will re-push the images listed in $KIND_SERVICES with the correct tag and redeploy the lagoon-core chart. This is useful for testing small changes to Lagoon services, but does not support "live" development. You will need to rebuild these images locally first, e.g `rm build/api && make build/api`

```bash
make kind/local-dev-patch
```
will build the typescript services, using your locally installed node.js (it should be >16.0), then mount the "dist" folders from the Lagoon services into the correct lagoon-core pods in Kubernetes, and redeploy the lagoon-core chart with the services running with `nodemon`watching the code for changes. This will facilitate "live" development on Lagoon - note that occasionally the pod in Kubernetes may require redeployment for a change to show. Clean any build artifacts from those services if you're rebuilding different branches with `git clean -dfx` as the dist folders are ignored by git.

```bash
make kind/local-dev-logging
```
will create a standalone OpenDistro for Elasticsearch cluster in your local Docker, and configure Lagoon to dispatch all logs (Lagoon and project) to it, using the configuration in [lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging)

```bash
make kind/retest
```
will re-run a suite of tests (defined in the $TESTS variable) against the existing cluster. It will re-push the images needed for tests (tests, local-git, and the data-watcher-pusher). If updating a test configuration, the tests image will need to be rebuilt first e.g `rm build/tests && make build/tests && make kind/retest`

```bash
make kind/push-images
```
is a subroutine used to push a range of images up to the image registry.

```bash
make kind/clean
```
will remove the Kind Lagoon cluster from your local Docker.

### Ansible

The Lagoon test uses Ansible to run the test suite.  Each range of tests for a specific function has been split into it's own routine.  If you are performing development work locally, select which tests to run, and update the $TESTS variable in the Makefile to reduce the concurrent tests running.

The configuration for these tests is held in three services

* `tests` is the Ansible test services themselves.  The local testing routine runs each individual test as a separate container within a test-suite pod.  These are listed below.
* `local-git` is a git server hosted in the cluster that holds the source files for the tests.  Ansible pulls and pushes to this repository throughout the tests
* `api-data-watcher-pusher` is a set of GraphQL mutations that pre-populates local Lagoon with the necessary Kubernetes configuration, test user accounts and SSH keys, and the necessary groups and notifications.  **Note that this will wipe local projects and environments on each run**

The individual routines relevant to Kubernetes are:

* `active-standby-kubernetes ` runs tests to check active/standby in Kubernetes
* `api` runs tests for the api - branch/pr deployment, promotion
* `bitbucket`, `gitlab` and `github` run tests for the specific SCM providers
* `drupal-php74` runs a single-pod MariaDB, MariaDB DBaaS and a Drush-specific test for a Drupal 8&9 project (`drupal-php73` doesn't do the Drush test)
* `drupal-postgres` runs a single-pod PostgreSQL and a PostgreSQL DBaaS test for a Drupal 8 project
* `elasticsearch` runs a simple nginx proxy to an Elasticsearch single-pod
* `features-api-variables` runs tests that utilise variables in Lagoon
* `features-kubernetes` runs a range of standard Lagoon tests, specific to Kubernetes
* `features-kubernetes-2` runs more advanced kubernetes-specific tests - covering multiproject and subfolder configurations
* `nginx`, `node` and `python` run basic tests against those project types
* `node-mongodb` runs a single-pod MongoDB test and a MongoDB DBaaS test against a NodeJS app

There are a few other legacy Openshift-specific tests in there that may or may not work with Openshift-based clients.

## Local Development

Most services are written in [Node.js](https://nodejs.org/en/docs/). As many of these services share similar Node.js code and Node.js packages, we're using a feature of [Yarn](https://yarnpkg.com/en/docs), called [Yarn workspaces](https://yarnpkg.com/en/docs/workspaces). Yarn workspaces need a `package.json` in the project's root directory that defines the workspaces.

The development of the services can happen directly within Docker. Each container for each service is set up in a way that its source code is mounted into the running container \([see `docker-compose.yml`](../using-lagoon-the-basics/docker-compose-yml.md)\). Node.js itself is watching the code via `nodemon` , and restarts the Node.js process automatically on a change.

### lagoon-commons

The services not only share many Node.js packages, but also share actual custom code. This code is within `node-packages/lagoon-commons`. It will be automatically symlinked by Yarn workspaces. Additionally, the [`nodemon`](https://www.npmjs.com/package/nodemon) of the services is set up in a way that it checks for changes in `node-packages` and will restart the node process automatically.

## Troubleshooting

⚠ **I can't build a docker image for any Node.js based service**

Rebuild the images via

```bash
make clean
make build
```

⚠ **I get errors about missing node\_modules content when I try to build / run a Node.js based image**

Make sure to run `yarn` in Lagoon's root directory, since some services have common dependencies managed by `yarn` workspaces.

