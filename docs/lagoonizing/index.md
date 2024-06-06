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

## What {{ defaults.helpstring }} Needs

The person setting up your Lagoon, usually {{ defaults.helpstring }} will need some information, [which is detailed here](../using-lagoon-the-basics/setup-project.md).

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

    Lagoon only reads the labels, service names, image names and build definitions from a `docker-compose.yml` file. Definitions like: ports, environment variables, volumes, networks, links, users, etc. are IGNORED. This is intentional, as the `docker-compose` file is there to define your local environment configuration. Lagoon learns from the `lagoon.type` the type of service you are deploying and from that knows about ports, networks and any additional configuration that this service might need.

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
    # Uncomment to enable xdebug and then restart via `docker compose up -d`
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
This tells Lagoon what to mount into the container. Your web application lives in `/app`, but you can add or change this if needed.

`x-environment`:

- Here you can set your local development URL. If you are using Pygmy, it must end with `.docker.amazee.io.`
- If you want to exactly mimic the production environment, uncomment `LAGOON_ENVIRONMENT_TYPE: production`.
- If you want to enable x-debug, uncomment `DEBUG_ENABLE: "true"`.

`x-user`:
You are unlikely to need to change this, unless you are on Linux and would like to run with a user other than 1000.

### `services`

This defines all the services you want to deploy. Unfortunately, `docker-compose` calls them services, even though they are actually defining the containers. Going forward we'll be calling them services, and throughout this documentation.

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

Lagoon still needs to understand which of the two services is the _actual_ individual service type (`nginx` and `php` in this case). It does this by searching for the service names of the matching service types. `nginx-php-persistent` expects one service with the name `nginx` and one with `php` in the `docker-compose.yml`.

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
  main:
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
      mariadb: mariadb.main.deployment.yml
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

### General Settings

#### `docker-compose-yaml`

This file tells the build script which `docker-compose` YAML file should be used, in order to learn which services and containers should be deployed. This defaults to `docker-compose.yml`, but could be used for a specific Lagoon `docker-compose` YAML file if you need something like that.

#### `environment_variables.git_sha`

This setting allows you to enable injecting the deployed Git SHA into your project as an environment variable. By default this is disabled. Setting the value to `true` sets the SHA as the environment variable `LAGOON_GIT_SHA`.

### Tasks

There are different type of tasks you can define, and they differ when exactly they are executed in a build flow:

#### Pre-Rollout Tasks - `pre_rollout.[i].run`

The tasks defined as `pre_rollout` tasks will run against your project _after_ the new images have been built successfully, and _before_ the project gets altered in any way. This feature enables you, for example, to create a database dump before the rollout is running, as in our example above. This will make it easier to roll back in case of an issue with the rollout.

#### Post-Rollout Tasks - `post_rollout.[i].run`

Here you can specify tasks which need to run against your project, after:

- All images have been successfully built.
- All containers are updated with the new images.
- All running containers have passed their readiness checks.

Common uses for `post_rollout` tasks include running `drush updb`, `drush cim`, or clearing various caches. In the above example, we run `drush cim` and `drush cr`.

`name`

- The name is an arbitrary label for making it easier to identify each task in the logs.

`command`

- Here you specify what command should run. These are run in the `WORKDIR` of each container. For Lagoon images this is `/app`, keep this in mind if you need to `cd` into a specific location to run your task.

`service`

- The service in which to run the task. If following our drupal-example, this will be the CLI container, as it has all your site code, files, and a connection to the database. Typically you do not need to change this.

`shell`

Which shell should be used to run the task. By default `sh` is used, but if the container also has other shells (like bash), you can define it here. This is useful if you want to run some small if/else bash scripts within the post-rollouts. (see the example above for how to write a script with multiple lines).

### Routes

#### `routes.autogenerate.enabled`

This allows for the disabling of the automatically created routes altogether. This does NOT disable the custom routes per environment, see below for more on that.

#### `routes.autogenerate.insecure`

This allows you to define the behavior of the automatically created routes. This does NOT configure the custom routes per environment, see below for more on that. This is the option we’re using in the example above, with `insecure: Redirect`.

The following options are allowed:

`Allow`

- Sets up routes for both HTTP and HTTPS (this is the default).

`Redirect`

- Will redirect any HTTP requests to HTTPS.

`None`

- A route for HTTP will not be created, and no redirect.

### Environments

Environment names match your deployed branches or pull requests. This allows each environment to have a different configuration. In this example, we have the environments main and staging.

#### Monitoring a Specific Path

When UptimeRobot is configured for your cluster, Lagoon will inject annotations to each route/ingress for use by the `stakater/IngressControllerMonitor`. The default action is to monitor the homepage of the route. If you have a specific route to be monitored, this can be overridden by adding a `monitoring-path` to your route specification. A common use is to set up a path for monitoring which bypasses caching to give a more real-time monitoring of your site.

```yaml title=".lagoon.yml example"
     - "www.example.com":
            monitoring-path: "/bypass-cache"
```

#### `environments.[name].routes`

In the route section, we identify the domain names to which the environment will respond. It is typical to only have an environment with routes specified for your production environment. All environments receive a generated route, but sometimes there is a need for a non-production environment to have its own domain name. You can specify it here, and then add that domain with your DNS provider as a CNAME to the generated route name (these routes publish in deploy messages).

The first element after the environment is the target service, NGINX in our example. This is how we identify which service incoming requests will be sent to.

The simplest route is the `example.com` example in our sample `.lagoon.yml` above - you can see it has no additional configuration. This will assume that you want a Let's Encrypt certificate for your route and no redirect from HTTPS to HTTP.

#### Annotations

!!! info
    Route/Ingress annotations are only supported by projects that deploy into clusters that run nginx-ingress controllers! Check with {{ defaults.helpstring }} if this is supported.

Annotations can be a YAML map of annotations supported by the `nginx-ingress` controller, this is specifically useful for easy redirects:

In this example any requests to `example.ch` will be redirected to `https://www.example.ch` with keeping folders or query parameters intact:

`(example.com/folder?query -> https://www.example.ch/folder?query)`

```yaml title=".lagoon.yml example"
        - "example.ch":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
```

You can of course also redirect to any other URL not hosted on Lagoon. This will direct requests to `example.de` to `https://www.google.com`:

```yaml title=".lagoon.yml example"
        - "example.de":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.google.com
```

#### SSL Configuration - `tls-acme`

`tls-acme : ‘true’`

- Tells Lagoon to issue a Let's Encrypt certificate for that route. This is the default.
- If you don't want a Let's Encrypt, set this to `tls-acme: ‘false’`.

`insecure`

- Can be set to `None`, `Allow` or `Redirect`.
- Allow simply sets up both routes for HTTP and HTTPS (this is the default).
- `Redirect` will redirect any HTTP requests to HTTPS.

`None`

- Will mean a route for HTTP will not be created, and no redirect will take place.

`Hsts`

- Can be set to a value of `max-age=31536000;includeSubDomains;preload`.
- Ensure there are no spaces and no other parameters included.
- Only the `max-age` parameter is required. The required max-age parameter indicates the length of time, in seconds, the HSTS policy is in effect for.

!!! info
    If you plan to switch from a SSL certificate signed by a Certificate Authority (CA) to a Let's Encrypt certificate, it's best to get in touch with {{ defaults.helpstring }} to oversee the transition.

#### `environments.[name].types`

The Lagoon build process checks the `lagoon.type` label from the `docker-compose.yml` file in order to learn what type of service should be deployed (read more about them in [the documentation of docker-compose.yml](../concepts-basics/docker-compose-yml.md)).

Sometimes you might want to override the type just for a single environment, and not for all of them.

##### `service-name: service-type

- `service-name`` is the name of the service from `docker-compose.yml` you would like to override.
- `service-type` the type of the service you would like to use in your override.

For example, if you want a MariaDB-Galera high availability database for your production environment called main - this is what we’re doing in our example file:

```yaml title=".lagoon.yml example"
environments:
  main:
    types:
      mariadb: mariadb-galera
```

#### `environments.[name].templates`

The Lagoon build process checks the `lagoon.template` label from the `docker-compose.yml` file in order to check if the service needs a custom template file (read more about them in [the documentation of docker-compose.yml](../concepts-basics/docker-compose-yml.md)).

Sometimes you might want to override the template just for a single environment, and not for all of them:

##### `service-name: template-file`

- `service-name` is the name of the service from `docker-compose.yml` you would like to override.
- `template-file` is the path and name of the template to use for this service in this environment.

```yaml title=".lagoon.yml example"
environments:
  main:
    templates:
      mariadb: mariadb.main.deployment.yml
```

#### `environments.[name].rollouts`

The Lagoon build process checks the `lagoon.rollout` label from the `docker-compose.yml` file in order to check if the service needs a special rollout type (read more about them in [the documentation of docker-compose.yml](../concepts-basics/docker-compose-yml.md)).

Sometimes you might want to override the rollout type just for a single environment, especially if you also overwrote the template type for the environment:

##### `service-name: rollout-type`

- `service-name` is the name of the service from `docker-compose.yml` you would like to override.
- `rollout-type` is the type of rollout. See [the documentation of docker-compose.yml](../concepts-basics/docker-compose-yml.md) for possible values.

```yaml title=".lagoon.yml example"
environments:
  main:
    rollouts:
      mariadb: statefulset
```

#### Cron jobs - `environments.[name].cronjobs`

As most of the time it is not desirable to run the same cron jobs across all environments, you must explicitly define which jobs you want to run for each environment. In our example, we’re creating a drush cron job that will run once per hour.

`name`

- Just a friendly name for identifying what the cron job will do.

`schedule`

- The schedule for executing the cron job. This follows the standard convention of cron. If you're not sure about the syntax, [Crontab Generator](https://crontab-generator.org/) can help.
- You can specify `M` for the minute, and your cron job will run once per hour at a random minute (the same minute each hour), or `M/15` to run it every 15 mins, but with a random offset from the hour (like 6, 21, 36, 51).
- You can specify `H` for the hour, and your cron job will run once per day at a random hour (the same hour every day), or `H(2-4)` to run it once per day within the hours of 2-4.

`command`

- The command to execute. Like the tasks, this executes in the `WORKDIR` of the service. For Lagoon images, this is `/app`.

`service`

- Which service of your project to run the command in. For most projects, this is the CLI service.

There is quite a bit more you can do in `.lagoon.yml`. Check out [our documentation on `.lagoon.yml`](../concepts-basics/lagoon-yml.md) to find out.

## Drupal-specific Setup

If you’re moving a Drupal site to Lagoon, there are a few Drupal-specific tasks to complete in order to get everything all set up.

### Settings Files

The next step is to update your settings files. Lagoon uses a set of environment-specific settings files which use environment variables, so no sensitive information is stored in these files, and they are all safe to commit. We have a variety of different example projects in [our example repository](https://github.com/uselagoon/lagoon-examples) - if you’re starting from scratch, we encourage using one of them. If you’re not, just pick a similar one and copy the relevant settings files. [Check out the documentation on environment variables](../concepts-advanced/environment-variables.md) for more information on how to use them.

Copy in the settings files from the example repository, and then review it to remove configuration for services that your site isn’t using (for example, not all sites use Solr or Redis). If you need to override configuration for a specific environment type (things like disabling caching on development environments), additional settings files can be set up (there’s even some in the example repository already), and are loaded in the following order:

```php title="settings.php"

 all.settings.php
 all.services.yml
 production.settings.php
 production.services.yml
 development.settings.php
 development.services.yml
 settings.local.php
 services.local.yml
```

### Update Your ``.gitignore`` Settings

Make sure your `.gitignore` will allow you to commit the settings files. Drupal is shipped with `sites/*/settings*.php` and `sites/*/services*.yml` in `.gitignore.` You can remove that, as with Lagoon we don't ever keep sensitive information in the Git repository.

### Note About Webroot in Drupal

Unfortunately the Drupal community has not decided on a standardized webroot folder name. Some projects put Drupal within `/web`, and others within `/docroot` or somewhere else. The Lagoon Drupal settings files assume that your Drupal is within `/web`, if this is different for your Drupal installation, please adapt the files accordingly.

### Build Your Images

First, we need to build the defined images:

```bash title="build your images"
docker compose build
```

This may take several minutes and you’ll get a long response, [which should look something like this](https://gist.github.com/AlannaBurke/1bdad6aab977b0994c245834e61b6b50).

This will tell `docker-compose` to build the Docker images for all containers that have a `build:` definition in `docker-compose.yml`. Usually for Drupal this includes `cli`, `nginx` and `php`. We do this because we want to run specific build commands (like `composer install`) or inject specific environment variables (like `WEBROOT`) into the images.

Usually building is not needed every time you edit your Drupal code (as the code is mounted into the containers from your host), but rebuilding does not hurt. Plus Lagoon will build the exact same Docker images during a deployment, so you check that your build will also work during a deployment by just running `docker compose build` again.

### Start Containers

Now that the images are built, we can start the containers:

```bash title="start the containers"
docker compose up -d
```

You will get a response something like this:

```bash title="containers started"
➜  lagoon-test git:(main) docker compose up -d
Recreating lagoon-test_cli_1   ... done
Starting lagoon-test_redis_1   ... done
Starting lagoon-test_solr_1    ... done
Starting lagoon-test_mariadb_1 ... done
Recreating lagoon-test_php_1   ... done
Recreating lagoon-test_nginx_1 ... done
Recreating lagoon-test_varnish_1 ... done
```

This will bring up all containers. After the command is done, you can check with `docker compose ps` to ensure that they are all fully up and have not crashed. That response should look something like this:

```bash title="view running containers"
➜  lagoon-test git:(main) docker compose ps
Name                       Command               State            Ports
----------------------------------------------------------------------------------------
lagoon-test_cli_1       /sbin/tini -- /lagoon/entr ...   Up      9000/tcp
lagoon-test_mariadb_1   /sbin/tini -- /lagoon/entr ...   Up      0.0.0.0:32768->3306/tcp
lagoon-test_nginx_1     /sbin/tini -- /lagoon/entr ...   Up      8080/tcp
lagoon-test_php_1       /sbin/tini -- /lagoon/entr ...   Up      9000/tcp
lagoon-test_redis_1     /sbin/tini -- /lagoon/entr ...   Up      6379/tcp
lagoon-test_solr_1      /sbin/tini -- /lagoon/entr ...   Up      0.0.0.0:32769->8983/tcp
lagoon-test_varnish_1   /sbin/tini -- /lagoon/entr ...   Up      8080/tcp
```

If there is a problem, check the logs with `docker compose logs -f [servicename]`.

### Re-Run `composer install`` (for Composer projects only)

If you’re running a Drupal 8+ project, you should be using Composer, and you’ll need to get all dependencies downloaded and installed. Connect into the cli container and run composer install:

```bash title="re-run composer install"
docker compose exec cli bash
[drupal-example]cli-drupal:/app$ composer install
```

This might sound weird, as there was already a `composer install` executed during the build step, so here’s why we do this again:

- In order to be able to edit files on the host and have them immediately available in the container, the default `docker-composer.yml` mounts the whole folder into the containers (this happens with `.:/app:delegated` in the `volumes` section). This also means that all dependencies installed during the Docker build are overwritten with the files on the host.
- Locally, you probably want access to dependencies defined as `require-dev` in `composer.json`, while on a production deployment they would just use unnecessary space. So we run `composer install --no-dev` in the Dockerfile and `composer install` manually.

If everything went well, open the `LAGOON_ROUTE` defined in `docker-compose.yml` (for example `http://drupal.docker.amazee.io`) and you should be greeted by a nice Drupal error. Don't worry - that's okay right now, the most important thing is that it tries to load a Drupal site.

If you get a 500 or similar error, make sure that everything is loaded properly with Composer.

### Check Status and Install Drupal

Finally it's time to install Drupal, but just before that we want to make sure everything works. We suggest using Drush for that with `drush status`:

```bash title="run drush status"
docker compose exec cli bash
[drupal-example]cli-drupal:/app$ drush status
```

The above command should return something like the following:

```bash title="drush status results"
[drupal-example]cli-drupal:/app$ drush status
[notice] Missing database table: key_value
Drupal version       :  8.6.1
Site URI             :  http://drupal.docker.amazee.io
Database driver      :  mysql
Database hostname    :  mariadb
Database port        :  3306
Database username    :  drupal
Database name        :  drupal
PHP binary           :  /usr/local/bin/php
PHP config           :  /usr/local/etc/php/php.ini
PHP OS               :  Linux
Drush script         :  /app/vendor/drush/drush/drush
Drush version        :  9.4.0
Drush temp           :  /tmp
Drush configs        :  /home/.drush/drush.yml
                        /app/vendor/drush/drush/drush.yml
Drupal root          :  /app/web
Site path            :  sites/default

```

!!! info ""
    You may have to tell pygmy about your public key before the next step. If you get an error like `Permission denied (publickey)`, check out the documentation here: [pygmy - adding ssh keys](https://pygmy.readthedocs.io/en/master/usage/#adding-ssh-keys).

Now it’s time to install Drupal (if instead you would like to import an existing SQL File, please skip to the next step, but we suggest you install a clean Drupal in the beginning to be sure everything works.)

```bash title="run drush si"
[drupal-example]cli-drupal:/app$ drush site-install
```
This should output something like:

```bash title="drush si results"
[drupal-example]cli-drupal:/app$ drush site-install
You are about to DROP all tables in your 'drupal' database. Do you want to continue? (y/n): y
Starting Drupal installation. This takes a while. Consider using the --notify global option.
Installation complete.  User name: admin  User password: arbZJekcqh
Congratulations, you installed Drupal!
```

Now you can visit the URL defined in `LAGOON_ROUTE` and you should see a fresh and cleanly installed Drupal - Congrats!

### Import existing Database Dump

If you have an already existing Drupal site you probably want to import its database over to your local site. There are many different ways on how to create a database dump, if your current hosting provider has Drush installed, you can use the following:

```bash title="drush sql-dump"
[your-existing-site]$ drush sql-dump --result-file=dump.sql
Database dump saved to dump.sql                         [success]
```

Now you have a `dump.sql` file that contains your whole database.
Copy this file into your local Git repository and connect to the CLI, you should see the file in there:

```bash title="here's our dump file"
[drupal-example] docker compose exec cli bash
[drupal-example]cli-drupal:/app$ ls -l dump.sql
-rw-r--r--    1 root     root          5281 Dec 19 12:46 dump.sql
```
Now you can import the dump after dropping the current database (still connected to the cli):

```bash title="dump existing db and import dump file"
[drupal-example]cli-drupal:/app$ drush sql-drop
Do you really want to drop all tables in the database drupal? (y/n): y
[drupal-example]cli-drupal:/app$ drush sql-cli < dump.sql
```

### Drupal files directory

A Drupal site also consists of the files directory. To migrate your files from your existing site, just add the files into the correct folder (probably `web/sites/default/files`, `sites/default/files` or something similar). Remember what you've set as your webroot - it may not be the same for all projects.

## Deploy

If you’ve done everything in this guide, and {{ defaults.helpstring }} has everything set up, you are now ready to deploy your site!

If you are deploying a Drupal site, [follow this deployment guide](../applications/drupal/first-deployment-of-drupal.md).

For all other deployments, [follow this deployment guide](../using-lagoon-the-basics/first-deployment.md).
