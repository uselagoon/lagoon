# .lagoon.yml file
The `.lagoon.yml` is used to:

* define post rollout tasks
* set up SSL certificates
* add cronjobs for Environments
* define routes for accessing your sites

The `.lagoon.yml` file must be placed at the root of your repo.

## Example `.lagoon.yml`

```
docker-compose-yaml: docker-compose.yml

tasks:
  post-rollout:
    - run:
        name: env variables
        command: env
        service: cli
    - run:
        name: IF no Drupal installed drush si with no email sending
        command: |
            if [[ $(drush core-status bootstrap --pipe) == "" ]]; then
                # no drupal installed, we install drupal from scratch
                drush -y si
            else
                # drupal already installed, do nothing
                echo "drupal already installed"
            fi
        service: cli
        shell: bash
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
    routes:
      - nginx:
        - domain.com
        - "www.domain.com":
            tls-acme: 'true'
            insecure: Redirect
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # this will run the cron once per Hour
       command: drush cron
       service: cli
  staging:
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # this will run the cron once per Hour
       command: drush cron
       service: cli
```
## General Settings
### `docker-compose-yaml`
Tells the build script which docker-compose yaml file should be used in order to learn which services and containers should be deployed. This defaults to `docker-compose.yml` but could be used for a specific lagoon docker-compose yaml file if you need something like that.

## `routes.insecure`
This allows you to define the behaviour of the automatic creates routes (NOT the custom routes per environment, see below for them). You can define:
* `Allow` simply sets up both routes for http and https (this is the default).
* `Redirect` will redirect any http requests to https
* `None` will mean a route for http will _not_ be created, and no redirect

## Tasks

There are different type of tasks you can define, they differ when exactly they are executed in a build flow:

### `post_rollout.[i].run`
Here you can specify tasks which need to run against your project, _after_:
- all Images have been successfully built
- all Containers are updated with the new Images
- all Containers are running have passed their readyness checks
Common uses are to run `drush updb`, `drush cim`, or clear various caches.

* `name`
    - The name is an arbitrary label for making it easier to identify each task in the logs
* `command`
    - Here you specify what command should run. These are run in the WORKDIR of each container, for Lagoon images this is `/app`, keep this in mind if you need to `cd` into a specific location to run your task.
* `service`
    - The service which to run the task in. If following our drupal-example, this will be the CLI container, as it has all your site code, files, and a connection to the DB. Typically you do not need to change this.
* `shell`
    - Which shell should be used to run the task in. By default `sh` is used, but if the container also has other shells (like `bash`, you can define it here). This is usefull if you want to run some small if/else bash scripts within the post-rollouts.

## Environments
Environment names match your deployed branches or pull requests, it allows you for each environment to have a different config, in our example it will apply to the `master` and `staging` environment.
### `environments.[name].routes`
In the route section we identify the domain names which the environment will respond to. It is typical to only have an environment with routes specified for your production environment. All environments receive a generated route, but sometimes there is a need for a non-production environment to have it's own domain name, you can specify it here, and then add that domain with your DNS provider as a CNAME to the generated route name (these routes publish in deploy messages).

The first element after the environment is the target service, `nginx` in our example. This is how we identify which service incoming requests will be sent to.

The simplest route is the `domain.com` example above. This will assume that you want a Let's Encrypt certificate for your route and no redirect from https to http.

In the `"www.domain.com"` example, we see two more options (also see the `:` at the end of the route and that the route is wrapped in `"`, that's important!):

* `tls-acme: 'true'` tells Lagoon to issue a Let's Encrypt certificate for that route, this is the default. If you don't like a Let's Encrypt set this to `tls-acme: 'false'`
* `Insecure` can be set to `None`, `Allow` or `Redirect`.
    * `Allow` simply sets up both routes for http and https (this is the default).
    * `Redirect` will redirect any http requests to https
    * `None` will mean a route for http will _not_ be created, and no redirect will take place

### `environments.[name].cronjobs`
As most of the time it is not desireable to run the same cronjobs across all environments, you must explicitely define which jobs you want to run for each environment.

* `name:`
    * Just a friendly name for identifying what the cronjob will do
* `schedule:`
    * The schedule at which to execute the cronjob. This follows the standard convention of cron. If you're not sure about the syntax [Crontab Generator](https://crontab-generator.org/) can help.
    * You can specify `H` for the minute, and your cronjob will run once per hour at a random minute (the same minute each hour), or `H/15` to run it every 15 mins but with a random offset from the hour (like `6,21,36,51`)
    * You can specify `H` for the hour, and your cronjob will run once per day at a random hour (the same hour every day)
* `command:`
    * The command to execute. Like the tasks, this executes in the WORKDIR of the service, for Lagoon images this is `/app`
* `service:`
    * Which service of your project to run the command in. For most projects this is the `cli` service.

### `environments.[name].types`
The Lagoon Build processes checks the `lagoon.type` label from the `docker-compose.yml` file in order to learn what type of service should be deployed.

Sometime though you would like to override the type just for a single environment and not for all of them, like if you want a mariadb-galera high availability database for your production environment called `master`:

`service-name: service-type`
- `service-name` - is the name of the service from `docker-compose.yml` you would like to override
- `service-type` - the type of the service you would like the service to override to.

Example:

```
environments:
  master:
    types:
      mariadb: mariadb-galera
```