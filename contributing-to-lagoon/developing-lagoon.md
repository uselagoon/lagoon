# Developing Lagoon

Development of Lagoon happens locally via [Docker](https://docs.docker.com/get-docker/). We are using the new [Docker Multi Stage builds](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) very heavily, so it requires at least Docker version 17.06.1.

## Install Docker and Docker Compose

Please check the [official Docs of Docker](https://docs.docker.com/engine/installation/) for how to install Docker.

### Docker for Mac

Docker Compose is included in Docker for Mac installations.

### On Linux - Install Docker Compose

For Linux installations, see the directions here: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/).

## Install a Virtual Machine

### On GNU/Linux hosts

For GNU/Linux hosts, we are using KVM \(Kernel-based Virtual Machine\) as a default virtualization engine to run Openshift Minishift VM. For installation instuctions, see here: [https://docs.okd.io/latest/minishift/getting-started/setting-up-virtualization-environment.html\#for-linux](https://docs.okd.io/latest/minishift/getting-started/setting-up-virtualization-environment.html#for-linux)

### Install VirtualBox on other hosts

For hosts other than GNU/Linux, we are using VirtualBox to run the Openshift Minishift VM. For download and installation instructions see here: [https://www.virtualbox.org/](https://www.virtualbox.org/)

## Start Services

1. Add `192.168.42.0/24` to insecure registries in Docker [instructions here on how to do that](https://docs.docker.com/registry/insecure/).

   Also make sure that you give your Docker host minimum 4 CPUs and 4GB Ram.

{% hint style="warning" %}
Lagoon consists of a lot of services and Docker images. Building and running them locally might not even be necessary. 

We're using `make` \(see the [Makefile](https://github.com/amazeeio/lagoon/blob/master/Makefile)\) in order to only build the needed Docker images specifically for a part of Lagoon.
{% endhint %}

All of it is based around tests. So if you want to only build the part that is needed to work on the Node.js deployment, for example, you can run the tests with `make tests/node`, and this will then setup all the needed stuff for the Node.js deployment part \(OpenShift, building images, services\).

If you still want to build and start all services, go ahead:

2. Build images:

```bash
make build
```

3. Start Lagoon Services:

```bash
make up
```

4. Follow the Services logs:

```bash
make logs
```

5. Run tests \(read [Tests](tests.md) to learn more about testing\):

```bash
make tests
```

6. Look what happens in OpenShift \(credentials: developer/developer\):

```bash
echo "visit https://$(minishift --profile lagoon ip):8443/console"
```

## Local Development

Most services are written in [Node.js](https://nodejs.org/en/docs/). As many of these services share similar Node code and Node packages, we're using a new feature of [Yarn](https://yarnpkg.com/en/docs), called [`Yarn workspaces`](https://yarnpkg.com/en/docs/workspaces). Yarn workspaces needs a package.json in the projects root directory that defines the workspaces.

The development of the services can happen directly within Docker. Each container for each service is setup in a way that its source code is mounted into the running container \(see [`docker-compose.yml`](../docker-compose-yml.md). Node itself is watching the code via `nodemon` and restarts the Node process automatically on a change.

### lagoon-commons

The services not only share many Node packages, but also share actual custom code. This code is within `node-packages/lagoon-commons`. It will be automatically symlinked by Yarn workspaces, plus the [`nodemon`](https://www.npmjs.com/package/nodemon) of the services is setup in a way that it also checks for changes in `node-packages` and will restart the node process automatically.

### Hiera

The API uses a [Puppet](https://puppet.com/docs/puppet/latest/puppet_index.html)-compatible YAML format to store its data. On production, this [Hiera](https://puppet.com/docs/puppet/latest/hiera.html) is in another git repository. For local development, there is a folder called `local-hiera` which contains test data that is used during development and testing, plus has no client related data in them. For easier development, there is `local-hiera-watcher-pusher`, which watches the `local-hiera` folder. On every change, it pushes the changes into `local-git-server`, which emulates a git server just like it is on production. The API service is connecting to this local git server and updates its data from the server.

## Troubleshooting

⚠ **I can't build a docker image for any Node.js based service**

Rebuild the images via

```bash
make clean
make build
```

⚠ **I get errors about missing node\_modules content when I try to build / run a NodeJS based image**

Make sure to run `yarn` in lagoon's root directory, since some services have common dependencies managed by `yarn` workspaces.

⚠ **My builds can't resolve domains**

Some Internet Service Providers \(ISPs\) set up a "search domain" to catch domain name errors. Virtualbox will copy this setting into minishift, which can cause domain resolution errors in the OpenShift pods. To check for this problem, look at the `/etc/resolv.conf` in your failing pod and check for errant search domains.

To fix, you must remove the extra search domain.

* Log in to the minishift vm: `minishift ssh`.
* Remove the setting from `/etc/resolv.conf`.
* Restart openshift docker: `sudo docker restart origin`.
* Redeploy `docker-host` in the `lagoon` project.

