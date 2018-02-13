# Getting Started

## System Requirements

### Docker
 To run Lagoon Project your system must meet the requirements to run Docker. We suggest installing the latest version of Docker for your workstation. You can download Docker [here](https://www.docker.com/get-docker). We also suggest allowing Docker at least 4 CPUs and 4GB RAM.

### `pygmy`
Currently it is simplest to run Lagoon projects via the amazee.io [pygmy](https://github.com/amazeeio/pygmy) tool. We are evaluating adding support for other systems like Lando, Docksal, and Docker4Drupal, and will possibly add full support for these in the future. If you do have Lagoon running with a system like these, we would gladly love you to submit a PR.

`pygmy` is a Ruby gem, so simply `gem install pygmy`. For detailed usage info on `pygmy`, see the [amazee.io docs](https://docs.amazee.io/local_docker_development/pygmy.html)

## Preparing the site

### Drupal Settings Files
The containers of Lagoon provide all the configuration variables that Drupal requires via environment variables. We have provided a set of example Drupal settings files for you to use [here](https://github.com/amazeeio/drupal-setting-files/tree/lagoon). Copy these into your site. Don't forget to make sure you `.gitignore` will allow you to commit the settings files.

### Docker Configuration
Locally we use docker-compose to run projects for development and testing. In Lagoon, the `docker-compose.yml` does do a little bit more than just run the site locally for you. In addition to defining the services needed to run the site via `docker-compose`, we also add labels which tell Lagoon how to build your project. Because of this, when you deploy the project into Lagoon, you can be assured that the environment is as close a match as possible.

#### `docker-compose.yml`
A sample `docker-compose.yml` file is in our [drupal-example](https://github.com/amazeeio/drupal-example/blob/master/docker-compose.yml) repo. This example will set up a Drupal site with containers for Varnish 5, nginx, PHP 7.1 (php-fpm and cli containers), Redis, Solr, and Maria DB 10. For the most part, the file is straightforward, declare a service, it's image, and the `lagoon.type` label (see the [Image Types](/using_lagoon/types.md) document for a list of all types and versions). For example, to add Redis to our project, we simply add

```
  redis:
    image: amazeeio/redis
    labels:
      lagoon.type: redis
```
Some of the containers need changes beyond the Lagoon defaults. Things like adding libraries using Composer, building CSS using Gulp, or installing additional packages to the image. For these, we add additional build information to `docker-compose.yml`. The `cli` container from drupal-example shows this.

```
  cli:
    build:
      context: .
      dockerfile: Dockerfile.builder
    image: builder
    labels:
      lagoon.type: cli-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.persistent.name: nginx
    volumes:
      - .:/app:delegated
    volumes_from:
      - container:amazeeio-ssh-agent
    environment:
      - SSH_AUTH_SOCK=/tmp/amazeeio_ssh-agent/socket
```
The important change is the `build` section, this tells `docker-compose` to look for the specified Dockerfile to build the image for this service.

#### Dockerfiles
Any service which defines a build in the `docker-compose.yml` file must also have a Dockerfile in the repo. These are used to run pre-deploy/build tasks, define which image a service will use, and perform any needed customizations to the containers. Here is a sample of the `cli` service from drupal-example showing how to build the site with Composer:
```
FROM amazeeio/php:7.1-cli-drupal

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app

ENV WEBROOT=web
```
