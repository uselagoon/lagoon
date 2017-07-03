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

```sh
git clone git@github.com:amazeeio/lagoon.git
cd lagoon
git submodule update --init --recursive

# Make sure to check out the branches of hiera that we need locally
./initHiera.sh
```

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

1. test Openshift Node Deployment

```sh
docker-compose exec tests ansible-playbook /ansible/playbooks/node.yaml
```
