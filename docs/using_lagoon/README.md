# Using Lagoon

## Requirements

### Docker

To run a Lagoon Project, your system must meet the requirements to run Docker.

[Docker for Mac Requirements](https://docs.docker.com/docker-for-mac/install/#system-requirements) \| [Docker for Windows Requirements](https://docs.docker.com/docker-for-windows/install/#system-requirements) \| [Info for other platforms here](https://docs.docker.com/install/).

We suggest installing the latest version of Docker for your workstation. You can download Docker [here](https://www.docker.com/get-docker). We also suggest allowing Docker at least **4 CPUs** and **4 GB RAM**.

### Local Development Environments

TL;DR: install and start `pygmy`:

```text
gem install pygmy
pygmy up
```

[Pygmy](https://pygmy.readthedocs.io/en/master/) is an amazee.io flavored local development system.

Learn more about Lagoon, pygmy, and [Local Development Environments](local_development_environments.md)

## Step by Step Guides

* Drupal: [Lagoonize your Drupal Site](drupal/lagoonize.md)
* Drupal: [First Deployment Drupal](drupal/first_deployment.md)
* General: [Setup a new Project in Lagoon](setup_project.md)
* General: [First Deployment](first_deployment.md)
* General: [Deployment & Build Process of Lagoon](build_deploy_process.md)

## Overview of Lagoon Configuration Files

### `.lagoon.yml`

The main file that is used by Lagoon to understand what should be deployed and many more things. See [Documentation for .lagoon.yml](lagoon_yml.md)

### `docker-compose.yml`

This file is used by Docker Compose to start your local development environment. Lagoon also uses it to understand which of the services should be deployed, which type, and how to build them. This happens via `labels`. See [Documentation for docker-compose.yml](docker-compose_yml.md)

### Dockerfiles

Some Docker images and containers need additional customizations from the provided images, this usually has two reasons:

1. **Application code**: Containers like Nginx, PHP, Node.js, etc. need the actual programming code within their images. This is done during a Docker build step which are configured in Dockerfiles. Lagoon has full support for Docker and therefore also allows you full control over the resulting images via Dockerfile customizations.
2. **Customization of Images**: Lagoon also allows you to customize the base images according to your needs. This can include injecting an additional environment variable, changing a service configuration or even installing additional tools, even though we advise caution with installing additional tools to the Docker images, as you will be responsible for maintaining any updates or changes to those tools in the future!

## Supported Services & Base Images by Lagoon

| Type | Versions | Dockerfile |
| :--- | :--- | :--- |
| [elasticsearch](docker_images/elasticsearch.md) | 6.8.2, 7.1.1, 7.3.0 | [elasticsearch/Dockerfiles](https://github.com/amazeeio/lagoon/tree/master/images/elasticsearch) |
| [mariadb-drupal](docker_images/mariadb-drupal.md) | 10 | [mariadb-drupal/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/mariadb-drupal/Dockerfile) |
| [mariadb](docker_images/mariadb.md) | 10 | [mariadb/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/mariadb/Dockerfile) |
| [mongo](docker_images/mongo.md) | 3.6 | [mongo/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/mongo/Dockerfile) |
| [nginx](docker_images/nginx-drupal.md) | openresty/1.15.8.2 | [nginx/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/nginx/Dockerfile) |
| [nginx-drupal](docker_images/nginx.md) | openresty/1.15.8.2 | [nginx-drupal/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/nginx-drupal/Dockerfile) |
| [php-cli-drupal](docker_images/php-cli-drupal.md) | 7.2, 7.3 | [php/cli-drupal/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/php/cli-drupal/Dockerfile) |
| [php-cli](docker_images/php-cli.md) | 7.2, 7.3 | [php/cli/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/php/cli/Dockerfile) |
| [php-fpm](docker_images/php-fpm.md) | 7.2, 7.3 | [php/fpm/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/php/fpm/Dockerfile) |
| [postgres](docker_images/postgres.md) | 11.x | [postgres/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/postgres/Dockerfile) |
| [rabbitMQ](docker_images/rabbitmq.md) | 3.8 | [rabbitMQ/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/rabbitmq/Dockerfile) |
| [redis-persistent](docker_images/redis-permanent.md) | 5.0.0 | [redis-persistent/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/redis-persistent/Dockerfile) |
| [redis](docker_images/redis.md) | 5.0.0 | [redis/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/redis/Dockerfile) |
| [solr-drupal](docker_images/solr-drupal.md) | 5.5, 6.6, 7.5 | [solr-drupal/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/solr-drupal/Dockerfile) |
| [solr](docker_images/solr.md) | 5.5, 6.6, 7.5 | [solr/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/solr/Dockerfile) |
| [varnish-drupal](docker_images/varnish-drupal.md) | 5 | [varnish-drupal/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/varnish-drupal/Dockerfile) |
| [varnish](docker_images/varnish.md) | 5 | [varnish/Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/varnish/Dockerfile) |

All images are pushed to [https://hub.docker.com/u/amazeeio](https://hub.docker.com/u/amazeeio). We suggest always using the latest tag \(like `amazeeio/nginx:latest`\) or unsuffixed images \(like `amazeeio/node:10`\), as they are kept up to date in terms of features and security. If you choose to use a specific Lagoon version of an image like `amazeeio/nginx:v0.21.0` or `amazeeio/node:10-v0.21.0`, it is **your own responsibility** to upgrade the version of the images as soon as a new Lagoon version is released!

