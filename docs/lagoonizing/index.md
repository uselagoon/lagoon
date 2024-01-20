# Lagoonizing Your Existing Site

_Lagoonizing_, or getting your existing site ready for the Lagoon platform, isn't generally difficult (depending on your site and setup), but does have a handful of steps. We've put together a stepo-by-step guide to make this process easier for you.

## Requirements

Make sure your system [meets the requirements](../using-lagoon-the-basics/index.md) for working with Lagoon locally.

## Local Development Environment

[Set up your local development environment](../using-lagoon-the-basics/local-development-environments.md). You can choose between Pygmy and Lando.

## Command Line and Git

You'll need to interact with Lagoon via the command line, and you'll need Git as well, so make sure they're ready to go.

### Command line

You’ll need to use a command line terminal for some tasks. Whatever you want to use is fine, including your operating system default tool. Here are a few options:

- [iTerm2](https://iterm2.com/) (Mac)
- [PowerShell](https://docs.microsoft.com/en-us/powershell/) (Windows)
- [Fish](https://fishshell.com/) (Mac, Windows, Linux)
- [Tabby](https://tabby.sh/) (Mac, Windows, Linux)

### Install Git

If you don’t have one already, you’ll need a Git client of some kind. Command line, GUI, whatever works for you (our examples will use the command line, FYI). Here are a few options:

- [Installing Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) (Mac, Windows, Linux)
- [SourceTree](https://www.sourcetreeapp.com/) (Mac, Windows)
- [GitHub Desktop](https://desktop.github.com/) (Mac, Windows)
- [GitKraken](https://www.gitkraken.com/git-client) (Mac, Windows, Linux - free for public repositories)

## What Your Lagoon Administrator Needs

Your Lagoon administrator, the person who is setting up your Lagoon, will need some information, [which is detailed here](../using-lagoon-the-basics/setup-project.md).

## Configure Webhooks

Next, you'll need to configure webhooks for your Git respository. [You can find those instructions here](../using-lagoon-the-basics/configure-webhooks.md).


## `docker-compose.yml`

The `docker-compose.yml` file is used by Lagoon to:

- Learn which services/containers should be deployed.
- Define how the images for the containers are built.
- Define additional configurations like persistent volumes.

You can read more about it in [our `docker-compose.yml` documentation](../concepts-basics/docker-compose-yml.md).

This is the first of two files we’ll create and set up to get your site ready for Lagoon.

`Docker-compose` (the tool) is very strict in validating the content of the YAML file, so we can only do configuration within **labels** of a service definition.

!!! warning "Warning"

    Lagoon only reads the labels, service names, image names and build definitions from a docker-compose.yml file. Definitions like: ports, environment variables, volumes, networks, links, users, etc. are IGNORED. This is intentional, as the docker-compose file is there to define your local environment configuration. Lagoon learns from the lagoon.type the type of service you are deploying and from that knows about ports, networks and any additional configuration that this service might need.

Let’s walk through setting up some basic services. In this example, we’ll set up NGINX, PHP, and MariaDB, which you’ll need for many systems like Drupal, Laravel, and other content management systems.

Here is a straightforward example of a `docker-compose.yml` file for Drupal:

```yaml title="docker-compose.yml"
version: '2.3'

x-lagoon-project:
  # Lagoon project name (leave `&lagoon-project` when you edit this)
  &lagoon-project drupal-example

x-volumes:
  &default-volumes
    # Define all volumes you would like to have real-time mounted into the docker containers
    volumes:
      - .:/app:delegated

x-environment:
  &default-environment
    LAGOON_PROJECT: *lagoon-project
    # Route that should be used locally, if you are using pygmy, this route *must* end with .docker.amazee.io
    LAGOON_ROUTE: http://drupal-example.docker.amazee.io
    # Uncomment if you would like to have the system behave like in production
    #LAGOON_ENVIRONMENT_TYPE: production
    # Uncomment to enable xdebug and then restart via `docker-compose up -d`
    #XDEBUG_ENABLE: "true"

x-user:
  &default-user
    # The default user under which the containers should run. Change this if you are on linux and run with a user other than id `1000`.
    user: '1000'

services:
  nginx:
    build:
      context: .
      dockerfile: nginx.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/

  php:
    build:
      context: .
      dockerfile: php.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.name: nginx
      lagoon.persistent: /app/web/sites/default/files/

  mariadb:
    image: amazeeio/mariadb-drupal
    labels:
      lagoon.type: mariadb
```

Now let’s break down what each of these options mean.

### Basic Settings

`x-lagoon-project`:
This is the machine name of your project, define it here. We’ll use “drupal-example.”

`x-volumes`:
This tells Lagoon what to mount into the container. Your web application lives in /app, but you can add or change this if needed.

`x-environment`:
- Here you can set your local development URL. If you are using Pygmy, it must end with `.docker.amazee.io.`
- If you want to exactly mimic the production environment, uncomment `LAGOON_ENVIRONMENT_TYPE: production`.
- If you want to enable x-debug, uncomment `DEBUG_ENABLE: "true"`.

`x-user`:
You are unlikely to need to change this, unless you are on Linux and would like to run with a user other than 1000.

### `services`

This defines all the services you want to deploy. Unfortunately, docker-compose calls them services, even though they are actually defining the containers. Going forward we'll be calling them services, and throughout this documentation.

The **name** of the service (`nginx`, `php`, and `mariadb` in the example above) is used by Lagoon as the name of the Kubernetes pod (yet another term - again, we'll be calling them services) that is generated, plus any additional Kubernetes objects that are created based on the defined `lagoon.type`. This could be things like services, routes, persistent storage, etc.

### Docker Images
If you want Lagoon to build a Dockerfile for your service during every deployment, you can define it here:

`build`

- `context`
  - The build context path that should be passed on into the Docker `build` command.
- `dockerfile`:
  - Location and name of the Dockerfile that should be built.

!!! warning inline end "Warning"

    Lagoon does NOT support the short version of `build: <Dockerfile>` and will fail if it finds such a definition.

`image`

- If you don't need to build a Dockerfile and just want to use an existing Dockerfile, define it via `image`.

In our example, we’re giving the path of the current directory. NGINX is set to build `nginx.dockerfile`, and PHP, `php.dockerfile`. MariaDB is using an existing image at `amazeeio/mariadb-drupal`. You can [learn more about our Docker images here](../docker-images/commons.md).

### Types

Lagoon needs to know what type of service you are deploying in order to configure the correct Kubernetes objects.

This is done via the `lagoon.type` label. There are many different types to choose from. Read our public documentation about [Service Types](../concepts-advanced/service-types.md) to see all of them and their additional configuration possibilities.

You might have noticed that in our example, both the PHP and NGINX services have their type defined as `nginx-php-persistent`. That’s because they are what’s called multi-container pods.

### Multi-Container Pods

Kubernetes doesn’t deploy plain containers. Instead, it deploys pods, with each one or more containers. Usually Lagoon creates a single pod with a container inside for each defined `docker-compose` service. For some cases, we need to put two containers inside a single pod, as these containers are so dependent on each other that they should always stay together. An example for such a situation is the PHP and NGINX containers that both contain PHP code of a web application like Drupal, as we’ve done above.

For these cases, it is possible to tell Lagoon which services should stay together. This is done in the following way (remember that we are calling containers services):

1. Define both services with a `lagoon.type` that expects two services (in the example this is `nginx-php-persistent` defined on the NGINX and PHP services).
2. Link the second service with the first one, setting the label `lagoon.name` of the second one to match the first one. (in the example this is done by setting `lagoon.name: nginx`).

This will cause Lagoon to realize that the `nginx` and `php` services are combined in a pod that will be called `nginx`.

Lagoon still needs to understand which of the two services is the _actual_ individual service type (`nginx` and `php` in this case). It does this by searching for the service names of the matching service types. `nginx-php-persisten`t expects one service with the name `nginx` and one with `php` in the `docker-compose.yml`.

If for any reason you want to use different names for the services, or you need more than one pod with the type `nginx-php-persistent`, there is an additional label `lagoon.deployment.servicetype`, which can be used to define the actual service type.

Here’s an example showing how multi-container pods can be set up in more detail:

```yaml title="docker-compose.yml"
nginx:
    build:
      context: .
      dockerfile: nginx.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.name: nginx # If this isn't present, Lagoon will use the container name, which in this case is nginx.
      lagoon.deployment.servicetype: nginx
php:
    build:
      context: .
      dockerfile: php.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.name: nginx # We want this service to be part of the nginx pod in Lagoon.
      lagoon.deployment.servicetype: php
```

There is quite a bit more you can do in docker-compose.yml, but setting up your services is the most important part. [Check out our  documentation on `docker-compose.yml`](../concepts-basics/docker-compose-yml.md) to learn what else you can do.

## `.lagoon.yml`

The [`.lagoon.yml`](../concepts-basics/lagoon-yml.md) file is the central file for setting up your project. It contains configuration in order to do the following:

- Define routes for accessing your sites.
- Define pre-rollout tasks.
- Define post-rollout tasks.
- Set up SSL certificates.
- Add cron jobs for environments.

The `.lagoon.yml` file must be created and placed at the root of your Git repository.

Here is an example `.lagoon.yml` file showing a variety of configuration options for a Drupal site that we’ll go over:

```yaml title=".lagoon.yml"

docker-compose-yaml: docker-compose.yml

environment_variables:
  git_sha: 'true'

tasks:
  pre-rollout:
    - run:
        name: drush sql-dump
        command: mkdir -p /app/web/sites/default/files/private/ && drush sql-dump --ordered-dump --gzip --result-file=/app/web/sites/default/files/private/pre-deploy-dump.sql.gz
        service: cli
  post-rollout:
    - run:
        name: drush cim
        command: drush -y cim
        service: cli
        shell: bash
    - run:
        name: drush cr
        command: drush -y cr
        service: cli

routes:
  insecure: Redirect

environments:
  master:
    monitoring_urls:
      - "www.example.com"
      - "www.example.com/special_page"
    routes:
      - nginx:
        - example.com
        - example.net
        - "www.example.com":
            tls-acme: 'true'
            insecure: Redirect
            hsts: max-age=31536000
        - "example.ch":
            Annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch

    types:
      mariadb: mariadb-galera
    templates:
      mariadb: mariadb.master.deployment.yml
    rollouts:
      mariadb: statefulset
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # This will run the cron once per hour.
       command: drush cron
       service: cli
  staging:
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # This will run the cron once per hour.
       command: drush cron
       service: cli
```



## Drupal-specific Setup

## Deploy!