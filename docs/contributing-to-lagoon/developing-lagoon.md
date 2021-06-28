# Developing Lagoon

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

Running a Lagoon, Kubernetes or Docker Cluster on your local machine consumes a lot of resources. We recommend that you give your Docker host a minimum of 8 CPUs and 12GB RAM.

## Building Lagoon Locally

{% hint style="warning" %}
Only consider building Lagoon this way if you intend to develop features or functionality for it, or want to debug internal processes.  We will also be providing instruction to install Lagoon without building it (i.e. by using the published releases).

We're using `make` \(see the [Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile)\) in order to build the needed Docker images, configure Kubernetes and run tests
{% endhint %}

We have provided a number of routines in the [Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile) to cover most local development scenarios.  Here we will run through a complete process.

1. Build images.  Here -j8 sets make to use 8 cores parallelisation to speed the build up - adjust as necessary, and we have set SKIP_SCAN=true to not scan the built images for vulnerabilities.  If set to false (or not passed), a `scan.txt` file will be created in the project root with the scan output.

```bash
make -j8 build make SKIP_SCAN=true
```

2. Start Lagoon test routine using the defaults in the makefile (all tests)

```bash
make kind/test
```

{% hint style="warning" %}
There are a lot of tests configured to run by default - please consider only testing locally the minimum that you need to ensure functionality.  This is done by specifying or removing tests from the TESTS variable in the Makefile.
{% endhint %}

This process will:

1. Add in the correct versions of the local development tools if not installed - kind, kubectl, Helm, JQ
2. Update the necessary Helm repositories for Lagoon to function
3. Ensure all the correct images have been built in the previous step
4. Create a local [KinD](https://kind.sigs.k8s.io/) cluster, which provisions an entire running Kubernetes Cluster in a local Docker container.  This cluster has been configured to talk to a provisioned image registry that we will be pushing the built Lagoon images to.  It has also been configured to allow access to the host filesystem for local development.
5. Clone Lagoon from https://github.com/uselagoon/lagoon-charts (use the `$CHARTS_TREEISH` variable in the Makefile to control which branch if needed)
6. Install the Harbor Image registry into the KinD cluster and configure it's ingress and access properly
7. Docker push the built images for Lagoon into the Harbor image registry
8. It then uses the [Makefile from lagoon-charts](https://github.com/uselagoon/lagoon-charts/blob/main/Makefile) to perform the rest of the setup steps
9. A suitable ingress controller is installed - we use the [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
10. A local NFS server provisioner is installed to handle specific volume requests - we use one that handles Read-Write-Many operations (RWX)
11. Lagoon Core is then installed, using the locally built images pushed to the cluster-local Image Registry, and using the default configuration, which may exclude some services not needed for local testing.  The installation will wait for the API and Keycloak to come online.
12. The DBaaS providers are installed - MariaDB, PostgreSQL and MongoDB.  This step provisions standalone databases to be used by projects running locally, and emulates the Managed services available via cloud providers (e.g. Cloud SQL, RDS or Azure Database)
13. Lagoon Remote is then installed, and configured to talk to the Lagoon Core, Databases and local storage.  The installation will wait for this to complete before continuing.
14. To provision the tests, the Lagoon Test chart is then installed, which provisions a local git server to host the test repositories, and preconfigures the Lagoon API database with the default TEST users, accounts and configuration, then performs readiness checks before starting tests.
15. Lagoon will run all the tests specified in the TESTS variable in the Makefile.  Each test creates its own project & environments, performs the tests, then removes the environments & projects.  The test runs are output to the console log in the lagoon-test-suite-* pod, and can be accessed one test per-container.

Hopefully, all the tests passed successfully and it's just that easy, right?

### Viewing the test progress / local cluster

The test routine creates a local Kubeconfig file (called `kubeconfig.kind.lagoon` in the root of the project, that can be used with a Kubernetes dashboard, viewer or CLI tool to access the local cluster.  We use tools like [Lens](https://k8slens.dev/), [Octant](https://octant.dev/), [kubectl](https://kubernetes.io/docs/reference/kubectl/cheatsheet/) or [Portainer](https://www.portainer.io/) in our workflows.  Lagoon Core, Remote and Tests all build in the `Lagoon` namespace, and each environment creates its own namespace to run, so make sure to use the correct context when inspecting.

The helmfiles used to build the local Lagoon are cloned into a local folder and symlinked to `lagoon-charts.kind.lagoon` where you can see the configuration.  We'll cover how to make easy modifications in a bit. 

### Interacting with your local Lagoon cluster





### Local Development

Most services are written in [Node.js](https://nodejs.org/en/docs/). As many of these services share similar Node.js code and Node.js packages, we're using a new feature of [Yarn](https://yarnpkg.com/en/docs), called [Yarn workspaces](https://yarnpkg.com/en/docs/workspaces). Yarn workspaces need a `package.json` in the project's root directory that defines the workspaces.

The development of the services can happen directly within Docker. Each container for each service is set up in a way that its source code is mounted into the running container \([see `docker-compose.yml`](../using-lagoon-the-basics/docker-compose-yml.md)\). Node.js itself is watching the code via `nodemon` , and restarts the Node.js process automatically on a change.

### lagoon-commons

The services not only share many Node.js packages, but also share actual custom code. This code is within `node-packages/lagoon-commons`. It will be automatically symlinked by Yarn workspaces. Additionally, the [`nodemon`](https://www.npmjs.com/package/nodemon) of the services is set up in a way that it checks for changes in `node-packages` and will restart the node process automatically.

### Hiera

The API uses a [Puppet](https://puppet.com/docs/puppet/latest/puppet_index.html)-compatible YAML format called [Hiera](https://puppet.com/docs/puppet/latest/hiera.html) to store its data. On production, this Hiera is in another Git repository. For local development, there is a folder called `local-hiera` which contains test data that is used during development and testing, plus it has no client related data. For easier development, there is `local-hiera-watcher-pusher`, which watches the `local-hiera` folder. On every change, it pushes the changes into `local-git-server`, which emulates a Git server just like it is on production. The API service is connecting to this local Git server and updates its data from the server.

## Troubleshooting

⚠ **I can't build a docker image for any Node.js based service**

Rebuild the images via

```bash
make clean
make build
```

⚠ **I get errors about missing node\_modules content when I try to build / run a Node.js based image**

Make sure to run `yarn` in Lagoon's root directory, since some services have common dependencies managed by `yarn` workspaces.

⚠ **My builds can't resolve domains**

Some Internet Service Providers \(ISPs\) set up a "search domain" to catch domain name errors. VirtualBox will copy this setting into MiniShift, which can cause domain resolution errors in the OpenShift pods. To check for this problem, look at the `/etc/resolv.conf` in your failing pod and check for errant search domains.

To fix, you must remove the extra search domain.

* Log in to the MiniShift vm: `minishift ssh`.
* Remove the setting from `/etc/resolv.conf`.
* Restart openshift docker: `sudo docker restart origin`.
* Redeploy `docker-host` in the `lagoon` project.

