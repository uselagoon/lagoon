# amazee.io Lagoon - where the cool microservices hang out!

The amazee.io lagoon is the amazee.io deployment system, completely independent from any servers running. Perfect for local development, testing new features and taking over the world.

- Schema: [https://www.lucidchart.com/documents/edit/a3cf0c4f-1bc1-438f-977d-4b26f235ceac](https://www.lucidchart.com/documents/edit/a3cf0c4f-1bc1-438f-977d-4b26f235ceac)
- Workshop Videos: [https://drive.google.com/drive/u/0/folders/0B7z7DpdobBRcY2pnS2FUVTNIVzg](https://drive.google.com/drive/u/0/folders/0B7z7DpdobBRcY2pnS2FUVTNIVzg)

Please take into account that currently, multi-stage dockerfiles only work with [Docker CE Edge](https://docs.docker.com/edge/).


## Install Docker

Lagoon requires Docker version >= 17.05.

### Via Homebrew

```sh
# Allow installation of other Cask versions
brew tap caskroom/versions
# Install Docker for Mac Edge
brew cask install docker-edge
```
## Start Services

1. clone me

1. start Lagoon Services

```sh
docker-compose up -d
```

1. Follow the Services logs

```sh
docker-compose logs -f
```

## Start & Test OpenShift

1. start OpenShift

```sh
./startOpenShift.sh
```

1. Add `https://docker-registry-default.192.168.77.100.nip.io:443` to insecure registries in docker.

1. build base images needed for testing

```sh
./buildBaseImages.sh
```

1. test Openshift Node Deployment

```sh
docker-compose exec tests ansible-playbook /ansible/playbooks/node.yaml
```

## Local Development

Most services are written in NodeJS. As many of these services share similar Node code and Node Packaes, we're using a new feature of yarn, called `yarn workspaces`. Yarn Workspaces needs a package.json in the projects root directory that defines the workspaces plus an `.yarnrc` that enables workspace mode.

The development of the services can happen directly within Docker. Each container for each service is setup in a way that it's source code is mounted into the running container. Node itself is watching the code via `nodemon` and restarts the node process automatically on a change.

### lagoon-commons

The services not only share many node packages, but also share actual custom code. This code is within `node-packages/lagoon-commons` it will be automatically symlinked by yarn workspaces, plus the nodemon of the services is setup in a way that it also checks for changes in `node-packages` and will restart the node process automatically

### Hiera

The API uses a puppet compatible yaml format to store it's data. On production this hiera is in another git repository. For local development there is a folder `local-hiera` which contains testdata that is used during development and testing, plus has no client related data in them. For easier development there is `local-hiera-watcher-pusher` which watches the `local-hiera` folder and on every changes pushes the changes into `local-git-server` which emulates a git server like it is on production. The api service is connecting to this local git server and updates it's data from it.