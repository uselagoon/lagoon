!!!warning
    **Note:** This documentation relates to developing the 1.x releases of Lagoon, built from the `master` branch.
    For documentation on the current development version of Lagoon, 2.x, built from the `main` branch, please visit https://docs.lagoon.sh

# Developing Lagoon

Development of Lagoon happens locally via [Docker](https://docs.docker.com/get-docker/). We are using the new [Docker Multi Stage builds](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) very heavily, so it requires at least Docker version 17.06.1.

## Install Docker and Docker Compose

Please check the [official Docs of Docker](https://docs.docker.com/engine/installation/) for how to install Docker.

### Docker for Mac

Docker Compose is included in Docker for Mac installations.

### On Linux - Install Docker Compose

For Linux installations, [see the directions here](https://docs.docker.com/compose/install/).

## Install a Virtual Machine

### On GNU/Linux hosts

For GNU/Linux hosts, we are using KVM \(Kernel-based Virtual Machine\) as a default virtualization engine to run Openshift Minishift VM. [Read the installation instructions here](https://docs.okd.io/latest/minishift/getting-started/setting-up-virtualization-environment.html#for-linux).

### Install VirtualBox on other hosts

For hosts other than GNU/Linux, we are using VirtualBox to run the Openshift Minishift VM. [For download and installation instructions see here](https://www.virtualbox.org/).

## Start Services

1. Add `192.168.42.0/24` to insecure registries in Docker. [Read the instructions here on how to do that](https://docs.docker.com/registry/insecure/).
2. Also make sure that you give your Docker host a minimum of 4 CPUs and 4GB Ram.

!!!hint
    Lagoon consists of a lot of services and Docker images. Building and running them locally might not even be necessary.

    We're using `make` \(see the [Makefile](https://github.com/amazeeio/lagoon/blob/master/Makefile)\) in order to only build the needed Docker images specifically for a part of Lagoon.


All of this is based around tests. So if you want to only build the part that is needed to work on the Node.js deployment, for example, you can run the tests with `make tests/node`, and this will then set up all the needed stuff for the Node.js deployment part \(OpenShift, building images, services\).

If you still want to build and start all services, go ahead:

1. Build images:

```bash
make build
```

1. Start Lagoon services:

```bash
make up
```

1. Follow the services logs:

```bash
make logs
```

1. Run tests \(read [Tests](tests.md) to learn more about testing\):

```bash
make tests
```

1. Check out what happens in OpenShift \(credentials: `developer`/`developer`\):

```bash
echo "visit https://$(minishift --profile lagoon ip):8443/console"
```

## Local Development

Most services are written in [Node.js](https://nodejs.org/en/docs/). As many of these services share similar Node.js code and Node.js packages, we're using a new feature of [Yarn](https://yarnpkg.com/en/docs), called [Yarn workspaces](https://yarnpkg.com/en/docs/workspaces). Yarn workspaces need a `package.json` in the project's root directory that defines the workspaces.

The development of the services can happen directly within Docker. Each container for each service is set up in a way that its source code is mounted into the running container \([see `docker-compose.yml`](../using_lagoon/docker-compose_yml/)\). Node.js itself is watching the code via `nodemon` , and restarts the Node.js process automatically on a change.

### lagoon-commons

The services not only share many Node.js packages, but also share actual custom code. This code is within `node-packages/commons`. It will be automatically symlinked by Yarn workspaces. Additionally,  the [`nodemon`](https://www.npmjs.com/package/nodemon) of the services is set up in a way that it checks for changes in `node-packages` and will restart the node process automatically.

Code changes in `node-packages/commones/src/*` should automatically be picked up from within the `services/*` containers. The services containers will automatically see, and reload, via the service `package.json` dev script, which sets nodemon to watch the node-packages/commons folder for changes.

example: `kubernetesbuilddeploymonitor`
```
  ...
  "scripts": {
    "dev": "nodemon --watch . --watch ../../node-packages --exec 'node --inspect=0.0.0.0:9229 src/index.js'"
  },
  ...
```

Service containers have the node-packages directory mounted via the docker-compose.yaml file
https://github.com/amazeeio/lagoon/blob/master/docker-compose.yaml#L195

And the `packages/commons` folder gets symlinked into the yarn_workspace generated “global” node_modules folder so changes in `packages/commons/src/*` should be immediately reflected in all the services containers.

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

Some Internet Service Providers \(ISPs\) set up a "search domain" to catch domain name errors. Virtualbox will copy this setting into minishift, which can cause domain resolution errors in the OpenShift pods. To check for this problem, look at the `/etc/resolv.conf` in your failing pod and check for errant search domains.

To fix, you must remove the extra search domain.

* Log in to the minishift vm: `minishift ssh`.
* Remove the setting from `/etc/resolv.conf`.
* Restart openshift docker: `sudo docker restart origin`.
* Redeploy `docker-host` in the `lagoon` project.

