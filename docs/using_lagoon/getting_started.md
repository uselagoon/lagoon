
## Preparing the site



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
