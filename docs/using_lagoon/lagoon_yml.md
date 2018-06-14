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
        name: drush cim
        command: drush -y cim
        service: cli
    - run:
        name: drush cr
        command: drush -y cr
        service: cli

environments:
  master:
    routes:
      - nginx:
        - domain.com
        - "www.domain.com":
            tls-acme: 'true'
            Insecure: Redirect
    cronjobs:
     - name: drush cron
       schedule: "H * * * *" # this will run the cron once per Hour
       command: drush cron
       service: cli

```

## Tasks
### `post_rollout`
Here you can specify tasks which need to run against your project after a successful build and deploy. Common uses are to run `drush updb`, `drush cim`, or clear various caches.

* `name`
    - The name is an arbitrary label for making it easier to identify each task in the logs
* `command`
    - Here you specify what command should run. These are run in the WORKDIR of each container, for Lagoon images this is `/app`, keep this in mind if you need to `cd` into a specific location to run your task.
* `service`
    - The service which to run the task in. If following our drupal-example, this will be the CLI container, as it has all your site code, files, and a connection to the DB. Typically you do not need to change this.

## Environments
Environment names match your deployed branches.
### `route`
In the route section we identify the domain names which the environment will respond to. It is typical to only have an environment with routes specified for your production environment. All environments receive a generated route, but sometimes there is a need for a non-production environment to have it's own domain name, you can specify it here, and then add that domain with your DNS provider as a CNAME to the generated route name (these routes publish in deploy messages).

The first element after the environment is the target service, `nginx` in our example. This is how we identify which service incoming requests will be sent to.

The simplest route is the `domain.com` example above. If you do not need SSL on your route, just add the domain, commit, and you are done.

In the `www.domain.com` example, we see two more options:

* `tls-acme: 'true'` tells Lagoon to issue a Let's Encrypt certificate for that route.
* `Insecure` can be set to `None`, `Allow` or `Redirect`.
    * `Allow` simply sets up both routes for http and https
    * `Redirect` will redirect any http requests to https
    * `None` will mean a route for http will _not_ be created, and no redirect will take place

### `cronjobs`
As most of the time it is not desireable to run the same cronjobs across all environments, you must explicitely define which jobs you want to run for each environment.

* `name:`
    * Just a friendly name for identifying what the cronjob will do
* `schedule:`
    * The schedule at which to execute the cronjob. This follows the standard convention of cron. If you're not sure about the syntax [Crontab Generator](https://crontab-generator.org/) can help. You can alternatively specify `H` for the minute, and your cronjob will run once per hour at a random minute (the same minute each hour).
* `command:`
    * The command to execute. Like the tasks, this executes in the WORKDIR of the service, for Lagoon images this is `/app`
* `service:`
    * Which service of your project to run the command in. For most projects this is the `cli` service.
