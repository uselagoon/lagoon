# Using Lagoon - Overview

This section covers some of the more advanced concepts in Lagoon. If you're familiar with these, move on to [Lagoon Concepts - Advanced](../concepts-advanced/index.md).

If you need help, contact your Lagoon administrator or reach out to the community and maintainers in our [Discord](../community/discord.md).

## Requirements

### Docker

To run a Lagoon Project, your system must meet the requirements to run Docker. We suggest installing the latest version of Docker for your workstation. You can download Docker [here](https://www.docker.com/get-docker). We also suggest allowing Docker at least **4 CPUs** and **4 GB RAM**.

### Local Development Environments

TL;DR: install and start `pygmy`:

```bash
brew tap pygmystack/pygmy; # (1)
brew install pygmy;
pygmy up
```

1. HomeBrew is the easiest way to install Pygmy, see the Pygmy docs for more info.

[Pygmy](https://github.com/pygmystack/pygmy/) is a container stack for local development, developed collaboratively with the Lagoon team.

Learn more about Lagoon, pygmy, and [Local Development Environments](local-development-environments.md)

## Step by Step Guides

* General: [set up a new project in Lagoon](setup-project.md)
* General: [first deployment](first-deployment.md)
* Drupal: [first deployment in Drupal](../applications/drupal/first-deployment-of-drupal.md)
* Drupal: [Lagoonize your Drupal site](../applications/drupal/step-by-step-getting-drupal-ready-to-run-on-lagoon.md)
* All: [build and deployment process of Lagoon](../concepts-basics/build-and-deploy-process.md)

## Overview of Lagoon Configuration Files

### `.lagoon.yml`

This is the main file that will be used by Lagoon to understand what should be deployed, as well as many other things. See [documentation for `.lagoon.yml`](../concepts-basics/lagoon-yml.md).

### `docker-compose.yml`

This file is used by `Docker Compose` to start your local development environment. Lagoon also uses it to understand which of the services should be deployed, which type, and how to build them. This happens via `labels`. See [documentation for `docker-compose.yml`](../concepts-basics/docker-compose-yml.md).

### Dockerfiles

Some Docker images and containers need additional customizations from the provided images. This usually has two reasons:

1. **Application code**: Containers like NGINX, PHP, Node.js, etc, need the actual programming code within their images. This is done during a Docker build step, which is configured in a Dockerfile. Lagoon has full support for Docker, and therefore also allows you full control over the resulting images via Dockerfile customizations.
2. **Customization of images**: Lagoon also allows you to customize the base images according to your needs. This can be to inject an additional environment variable, change a service configuration, or even install additional tools. We advise caution with installing additional tools to the Docker images, as you will need to maintain any adaptions in the future!

## Supported Services & Base Images by Lagoon

| Type | Versions | Dockerfile |
| :--- | :--- | :--- |
| [MariaDB](../docker-images/mariadb.md) | 10.4, 10.5, 10.6, 10.11 | [mariadb/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb) |
| [PostgreSQL](../docker-images/postgres.md) | 11, 12, 13, 14, 15 | [postgres/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres) |
| [MongoDB](../docker-images/mongodb.md) | 4 | [mongo/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mongo) |
| [NGINX](../docker-images/nginx.md) | openresty/1.21 | [nginx/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx) |
| [Node.js](../docker-images/nodejs.md) | 16, 18, 20 | [node/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/node) |
| [PHP FPM](../docker-images/php-fpm.md) | 8.0, 8.1, 8.2 | [php/fpm/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm) |
| [PHP CLI](../docker-images/php-cli.md) | 8.0, 8.1, 8.2 | [php/cli/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli) |
| [Python](../docker-images/nodejs.md) | 3.7, 3.8, 3.9, 3.10, 3.11 | [python/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python) |
| [Redis](../docker-images/redis.md) | 5, 6, 7 | [redis/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis) |
| [Solr](../docker-images/solr.md) | 7, 8 | [solr/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr) |
| [Varnish](../docker-images/varnish.md) | 5, 6, 7 | [varnish/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish) |
| [Opensearch](../docker-images/opensearch.md) | 2 | [opensearch/Dockerfiles](https://github.com/uselagoon/lagoon-images/blob/main/images/opensearch) |
| [RabbitMQ](../docker-images/rabbitmq.md) | 3.10 | [rabbitmq/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq) |
| [Ruby](../docker-images/ruby.md) | 3.0, 3.1, 3.2 | [ruby/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby) |

All images are pushed to [https://hub.docker.com/u/uselagoon](https://hub.docker.com/u/uselagoon). We suggest always using the latest tag \(like `uselagoon/nginx:latest`\) as they are kept up to date in terms of features and security.

If you choose to use a specific Lagoon version of an image like `uselagoon/nginx:20.10.0` or `uselagoon/node-10:20.10.0` it is your own responsibility to upgrade the version of the images as soon as a new Lagoon version is released!
