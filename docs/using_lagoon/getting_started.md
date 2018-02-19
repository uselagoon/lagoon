# Getting Started

## System Requirements

### Docker
 To run Lagoon Project your system must meet the requirements to run Docker. We suggest installing the latest version of Docker for your workstation. You can download Docker [here](https://www.docker.com/get-docker). We also suggest allowing Docker at least 4 CPUs and 4GB RAM.

### `pygmy`
Currently it is simplest to run Lagoon projects via the amazee.io [pygmy](https://github.com/amazeeio/pygmy) tool. We are evaluating adding support for other systems like Lando, Docksal, DDEV, and Docker4Drupal, and will possibly add full support for these in the future. If you do have Lagoon running with a system like these, we would gladly love you to submit a PR.

`pygmy` is a Ruby gem, so simply `gem install pygmy`. For detailed usage info on `pygmy`, see the [amazee.io docs](https://docs.amazee.io/local_docker_development/pygmy.html)

## Preparing the site

### Drupal Settings Files
The containers of Lagoon provide all the configuration variables that Drupal requires via environment variables. We have provided a set of example Drupal settings files for you to use [here](https://github.com/amazeeio/lagoon/tree/master/docs/using_lagoon/drupal). To download them as a ZIP File, click [here](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/amazeeio/lagoon/tree/master/docs/using_lagoon/drupal). Copy these into your Drupal site.

Don't forget to make sure you `.gitignore` will allow you to commit the settings files (Drupal is shipped with `sites/*/settings*.php` and `sites/*/services*.yml` in .gitignore, remove that, as with Lagoon we don't ever have sensitive information in the Git Repo.)

### Docker Configuration
Locally we use docker-compose to run projects for development and testing. In Lagoon, the `docker-compose.yml` does do a little bit more than just run the site locally for you. In addition to defining the services needed to run the site via `docker-compose`, we also add labels which tell Lagoon how to build your project. Because of this, when you deploy the project into Lagoon, you can be assured that the environment is as close a match as possible.

#### `docker-compose.yml`
A sample `docker-compose.yml` you have already copied with the Drupal Settings Files. This example will set up a Drupal site with containers for Nginx, PHP 7.1 (php-fpm and cli containers) and Maria DB 10. Redis, Solr, and Varnish are existing but commented. If you uncomment some of them, also make sure that you edit the `sites/default/settings.php` accordingly and enable the same services.


#### Modify `docker-compose.yml`
For the most part, the `docker-compose.yml` file is straightforward, declare a service, it's image, and the `lagoon.type` label (see the [Image Types](/using_lagoon/types.md) document for a list of all types and versions). For example, to add Redis to our project, we simply add

```
  redis:
    image: amazeeio/redis
    labels:
      lagoon.type: redis
```
Some of the containers need changes beyond the Lagoon defaults. Things like adding libraries using Composer, building CSS using Gulp, or installing additional packages to the image. For these, we add additional build information to `docker-compose.yml`. The `cli` container from drupal-example shows this.


#### Dockerfiles
Any service which defines a build in the `docker-compose.yml` file must also have a Dockerfile in the repo. These are used to run build tasks, define which image a service will use, and perform any needed customizations to the containers. Here is a sample of the `cli` service from drupal-example showing how to build the site with Composer:
```
FROM amazeeio/php:7.1-cli-drupal

COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --no-dev
COPY . /app

ENV WEBROOT=web
```
