# Development of Lagoon

Development of Lagoon happens locally via Docker. We are using the new [Docker Multi Stage builds](https://docs.docker.com/engine/userguide/eng-image/multistage-build/) very heavily, so it requires at least Docker Version 17.05.

## Install Docker

Please check the [official Docs of Docker](https://docs.docker.com/engine/installation/) how to install Docker.

## Start Services

1. clone this repo

2. build base images needed for testing

```sh
./buildBaseImages.sh
```

3. start Lagoon Services

```sh
docker-compose up -d
```

4. Follow the Services logs

```sh
docker-compose logs -f
```

## Start & Test OpenShift

1. start OpenShift

```sh
./startOpenShift.sh
```

2. Add `https://docker-registry-default.192.168.77.100.nip.io:443` to insecure registries in Docker (see [here](https://docs.docker.com/registry/insecure/) how to do that).

4. run tests

```sh
docker-compose run --rm tests ansible-playbook /ansible/tests/ALL.yaml
```

## Local Development

Most services are written in Node.js. As many of these services share similar Node code and Node Packaes, we're using a new feature of yarn, called `yarn workspaces`. Yarn Workspaces needs a package.json in the projects root directory that defines the workspaces plus an `.yarnrc` that enables workspace mode.

The development of the services can happen directly within Docker. Each container for each service is setup in a way that it's source code is mounted into the running container. Node itself is watching the code via `nodemon` and restarts the node process automatically on a change.

### lagoon-commons

The services not only share many node packages, but also share actual custom code. This code is within `node-packages/lagoon-commons` it will be automatically symlinked by yarn workspaces, plus the nodemon of the services is setup in a way that it also checks for changes in `node-packages` and will restart the node process automatically

### Hiera

The API uses a puppet compatible yaml format to store it's data. On production this hiera is in another git repository. For local development there is a folder `local-hiera` which contains testdata that is used during development and testing, plus has no client related data in them. For easier development there is `local-hiera-watcher-pusher` which watches the `local-hiera` folder and on every changes pushes the changes into `local-git-server` which emulates a git server like it is on production. The api service is connecting to this local git server and updates it's data from it.

### Troubleshooting

**I can't build any docker image for any Node.js based service**

Build the latest base images via

```sh
./buildBaseImages.sh
```

**I get errors about missing node_modules content when I try to build / run a NodeJS based image**

Make sure to run `yarn` in lagoon's root directory, since some services have common dependencies managed by `yarn` workspaces.