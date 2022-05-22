# .lagoon.yml

The `.lagoon.yml` file is the central file to set up your project. It contains configuration in order to do the following:

* [Define routes for accessing your sites](lagoon-yml.md#routes).
* [Define pre-rollout tasks](lagoon-yml.md#pre-rollout-tasks-pre_rollout-i-run).
* [Define post-rollout tasks](lagoon-yml.md#post-rollout-tasks-post_rollout-i-run).
* [Set up SSL certificates](lagoon-yml.md#ssl-configuration-tls-acme).
* [Add cron jobs for environments](lagoon-yml.md#cron-jobs-environments-name-cronjobs).

The `.lagoon.yml` file must be placed at the root of your Git repository.

## General Settings

### `docker-compose-yaml`

Tells the build script which docker-compose YAML file should be used, in order to learn which services and containers should be deployed. This defaults to `docker-compose.yml`, but could be used for a specific Lagoon docker-compose YAML file if needed.

### `environment_variables.git_sha`

This setting allows you to enable injecting the deployed Git SHA into your project as an environment variable. By default this is disabled. Setting the value to`true` sets the SHA as the environment variable `LAGOON_GIT_SHA`.

## Tasks

There are different type of tasks you can define, and they differ in when exactly they are executed in a build flow:

### Pre-Rollout Tasks - `pre_rollout.[i].run`

The tasks defined as `pre_rollout` tasks will run against your project _after_ the new images have been built successfully, and _before_ the project gets altered in any way. This feature enables you, for example, to create a database dump before the rollout is running. This will make it easier to roll back in case of an issue with the rollout.

### Post-Rollout Tasks - `post_rollout.[i].run`

Here you can specify tasks which need to run against your project, _after_:

* All images have been successfully built.
* All containers are updated with the new images.
* All containers are running have passed their readiness checks.

Common uses for post-rollout tasks include running `drush updb`, `drush cim`, or clearing various caches.

* `name`
  * The name is an arbitrary label for making it easier to identify each task in the logs.
* `command`
  * Here you specify what command should run. These are run in the WORKDIR of each container, for Lagoon images this is `/app`, keep this in mind if you need to `cd` into a specific location to run your task.
* `service`
  * The service which to run the task in. If following our Drupal example, this will be the CLI container, as it has all your site code, files, and a connection to the database. Typically you do not need to change this.
* `shell`
  * Which shell should be used to run the task in. By default `sh` is used, but if the container also has other shells \(like `bash`, you can define it here\). This is useful if you want to run some small if/else bash scripts within the post-rollouts. \(see the example above how to write a script with multiple lines\).
* `when`
  * The "when" clause allows for the conditional running of tasks. It expects an expression that will evaluate to a true/false value which determines whether the task should be run.

Note: If you would like to temporarily disable pre/post-rollout tasks during a deployment, you can set either of the following environment variables in the API at the project or environment level \(see how on [Environment Variables](../using-lagoon-advanced/environment-variables.md)\).

* `LAGOON_PREROLLOUT_DISABLED=true`
* `LAGOON_POSTROLLOUT_DISABLED=true`


#### Example post-rollout tasks

Here are some useful examples of post-rollout tasks that you may want to use or adapt for your projects.

Run only if Drupal not installed:

```yaml title=".lagoon.yml"
    - run:
        name: IF no Drupal installed
        command: |
            if tables=$(drush sqlq "show tables like 'node';") && [ -z "$tables" ]; then
                #### whatever you like
            fi
        service: cli
        shell: bash
```

Different tasks based on branch name:

```yaml title=".lagoon.yml"
    - run:
        name: Different tasks based on Branch Name
        command: |
            ### Runs if current branch is not 'production'
        service: cli
        when: LAGOON_GIT_BRANCH != "production"
```

Run shell script:

```yaml title=".lagoon.yml"
    - run:
        name: Run Script
        command: './scripts/script.sh'
        service: cli
```

Drupal & Drush 9: Sync database & files from master environment:

```yaml title=".lagoon.yml"
    - run:
        name: Sync DB and Files from master if we are not on master
        command: |
          # Only if we don't have a database yet
          if tables=$(drush sqlq 'show tables;') && [ -z "$tables" ]; then
              drush sql-sync @lagoon.master @self
              drush rsync @lagoon.master:%files @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
          fi
        service: cli
        when: LAGOON_GIT_BRANCH != "master"
```

## Backup Retention

### `backup-retention.production.monthly`

Specify the number of monthly backups Lagoon should retain for your project's production environment\(s\).

The global default is `1` if this value is not specified.

### `backup-retention.production.weekly`

Specify the number of weekly backups Lagoon should retain for your project's production environment\(s\).

The global default is `6` if this value is not specified.

### `backup-retention.production.daily`

Specify the number of daily backups Lagoon should retain for your project's production environment\(s\).

The global default is `7` if this value is not specified.

### `backup-retention.production.hourly`

Specify the number of hourly backups Lagoon should retain for your project's production environment\(s\).

The global default is `0` if this value is not specified.

## Backup Schedule

### `backup-schedule.production`

Specify the schedule for which backups will be ran for this project. Accepts cron compatible syntax with the notable exception that the `Minute` block must be the letter `M`. Any other value in the `Minute` block will cause the Lagoon build to fail. This allows Lagoon to randomly choose a specific minute for these backups to happen, while users can specify the remainder of the schedule down to the hour.

The global default is `M H(22-2) * * *` if this value is not specified. Take note that these backups will use the cluster's local timezone.

## Routes

### `routes.autogenerate.enabled`

This allows for the disabling of the automatically created routes \(NOT the custom routes per environment, see below for them\) all together.

### `routes.autogenerate.allowPullrequests`

This allows pull request to get autogenerated routes when route autogeneration is disabled.

```yaml title=".lagoon.yml"
routes:
  autogenerate:
    enabled: false
    allowPullrequests: true
```

### `routes.autogenerate.insecure`

This allows you to define the behavior of the automatic creates routes \(NOT the custom routes per environment, see below for more\). The following options are allowed:

* `Allow` simply sets up routes for both HTTP and HTTPS \(this is the default\).
* `Redirect` will redirect any HTTP requests to HTTPS.
* `None` will mean a route for HTTP will _not_ be created, and no redirect.

### `routes.autogenerate.prefixes`

This allows you to define an array of prefixes to be prepended to the autogenerated routes of each environment. This is useful for things like language prefix domains, or a multi-domain site using the Drupal `domain` module.

NOTE: This is only available for projects which deploy to a Kubernetes cluster.

```yaml title=".lagoon.yml"
routes:
  autogenerate:
    prefixes:
    - www
    - de
    - fr
    - it
```

## Environments

Environment names match your deployed branches or pull requests. This allows for each environment to have a different config. In our example it will apply to the `main` and `staging` environment.

### `environments.[name].monitoring_urls`

!!! Danger "Danger:"
    This feature will be removed in an upcoming release of Lagoon. Please use the newer `monitoring-path` method on your specific route.

!!! Note "Note:"
    Please note, Lagoon does not provide any direct integration to a monitoring service, this just adds the URLs to the API. On amazee.io, we take the `monitoring_urls` and add them to our StatusCake account.

At the end of a deploy, Lagoon will check this field for any URLs which you have specified to add to the API for the purpose of monitoring. The default value for this field is the first route for a project. It is useful for adding specific paths of a project to the API, for consumption by a monitoring service.

### `environments.[name].routes`

<iframe width="560" height="315" src="https://www.youtube.com/embed/vQxh87F3fW4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

In the route section, we identify the domain names to which the environment will respond. It is typical to only have an environment with routes specified for your production environment. All environments receive a generated route, but sometimes there is a need for a non-production environment to have its own domain name. You can specify it here, and then add that domain with your DNS provider as a CNAME to the generated route name \(these routes publish in deploy messages\).

The first element after the environment is the target service, `Nginx` in our example. This is how we identify which service incoming requests will be sent to.

The simplest route is the `example.com` example in our sample `.lagoon.yml` above - you can see it has no additional configuration. This will assume that you want a Let's Encrypt certificate for your route and no redirect from HTTPS to HTTP.

In the `"www.example.com"` example repeated below, we see two more options \(also notice the `:` at the end of the route and that the route is wrapped in `"`, that's important!\):

### **SSL Configuration - `tls-acme`**

* `tls-acme: 'true'` tells Lagoon to issue a Let's Encrypt certificate for that route. This is the default. If you don't want a Let's Encrypt, set this to `tls-acme: 'false'`
* `insecure` can be set to `None`, `Allow` or `Redirect`.
  * `Allow` simply sets up both routes for HTTP and HTTPS \(this is the default\).
  * `Redirect` will redirect any HTTP requests to HTTPS.
  * `None` will mean a route for HTTP will _not_ be created, and no redirect will take place.
* `hsts` can be set to a value of `max-age=31536000;includeSubDomains;preload`. Ensure there are no spaces and no other parameters included. Only the `max-age` parameter is required. The required `max-age` parameter indicates the length of time, in seconds, the HSTS policy is in effect for.

!!! Note "Note:"
    If you plan to switch from a SSL certificate signed by a Certificate Authority \(CA\) to a Let's Encrypt certificate, it's best to get in touch with your Lagoon administrator to oversee the transition. There are [known issues](https://github.com/tnozicka/openshift-acme/issues/68) during the transition. The workaround would be manually removing the CA certificate and then triggering the Let's Encrypt process.

```yaml title=".lagoon.yml"
     - "www.example.com":
            tls-acme: 'true'
            insecure: Redirect
            hsts: max-age=31536000
```

### **Monitoring a specific path**

When [UptimeRobot](https://uptimerobot.com/) is configured for your cluster \(OpenShift or Kubernetes\), Lagoon will inject annotations to each route/ingress for use by the `stakater/IngressControllerMonitor`. The default action is to monitor the homepage of the route. If you have a specific route to be monitored, this can be overridden by adding a `monitoring-path` to your route specification. A common use is to set up a path for monitoring which bypasses caching to give a more real-time monitoring of your site.

```yaml title=".lagoon.yml"
     - "www.example.com":
            monitoring-path: "/bypass-cache"
```

### **Ingress annotations**

!!! Note "Note:"
    Route/Ingress annotations are only supported by projects that deploy into clusters that run nginx-ingress controllers! Check with your Lagoon administrator if this is supported.

* `annotations` can be a yaml map of [annotations supported by the nginx-ingress controller](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/), this is specifically useful for easy redirects and other configurations.

#### **Restrictions**

Some annotations are disallowed or partially restricted in Lagoon.
The table below describes these rules.

If your `.lagoon.yml` contains one of these annotations it will cause a build failure.

| Annotation                                          | Notes                                                                                    |
| ---                                                 | ---                                                                                      |
| `nginx.ingress.kubernetes.io/auth-snippet`          | Disallowed                                                                               |
| `nginx.ingress.kubernetes.io/configuration-snippet` | Restricted to `rewrite`, `add_header`, `set_real_ip`, and `more_set_headers` directives. |
| `nginx.ingress.kubernetes.io/modsecurity-snippet`   | Disallowed                                                                               |
| `nginx.ingress.kubernetes.io/server-snippet`        | Restricted to `rewrite`, `add_header`, `set_real_ip`, and `more_set_headers` directives. |
| `nginx.ingress.kubernetes.io/stream-snippet`        | Disallowed                                                                               |
| `nginx.ingress.kubernetes.io/use-regex`             | Disallowed                                                                               |

#### **Ingress annotations redirects**

In this example any requests to `example.ch` will be redirected to `https://www.example.ch` with keeping folders or query parameters intact \(`example.com/folder?query` -&gt; `https://www.example.ch/folder?query`\)

```yaml title=".lagoon.yml"
        - "example.ch":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
```

You can of course also redirect to any other URL not hosted on Lagoon, this will direct requests to `example.de` to `https://www.google.com`

```yaml title=".lagoon.yml"
        - "example.de":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.google.com
```

#### Trusted Reverse Proxies

!!! warning "Warning:"
    Kubernetes will only process a single `nginx.ingress.kubernetes.io/server-snippet` annotation. Please ensure that if you use this annotation on a non-production environment route that you also include the `add_header X-Robots-Tag "noindex, nofollow";` annotation as part of your server-snippet. This is needed to stop robots from crawling development environments as the default server-snippet set to prevent this in development environments in the ingress templates will get overwritten with any `server-snippets` set in .lagoon.yml.

Some configurations involve a reverse proxy \(like a CDN\) in front of the Kubernetes Clusters. In these configurations the IP of the Reverse Proxy will appear as the `REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR` headers field in your applications. While the original IP of the requester can be found in the `HTTP_X_ORIGINAL_FORWARDED_FOR` header.

If you like the original IP to appear in the `REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR` headers, you need to tell the ingress which reverse proxy IPs you want to trust:

```yaml title=".lagoon.yml"
    - "example.ch":
        annotations:
          nginx.ingress.kubernetes.io/server-snippet: |
            set_real_ip_from 1.2.3.4/32;
```

This example would trust the CIDR `1.2.3.4/32` \(the IP `1.2.3.4` in this case\). Therefore if there is a request sent to the Kubernetes cluster from the IP `1.2.3.4` the `X-Forwarded-For` Header is analyzed and it's contents injected into `REMOTE_ADDR` `HTTP_X_REAL_IP` `HTTP_X_FORWARDED_FOR` headers.

### `Environments.[name].types`

The Lagoon build process checks the `lagoon.type` label from the `docker-compose.yml` file in order to learn what type of service should be deployed \(read more about them in the [documentation of `docker-compose.yml`](docker-compose-yml.md#custom-templates)\).

Sometimes you might want to override the **type** just for a single environment, and not for all of them. For example, if you want a standalone MariaDB database \(instead of letting the Service Broker/operator provision a shared one\) for your non-production environment called `develop`:

`service-name: service-type`

* `service-name` is the name of the service from `docker-compose.yml` you would like to override.
* `service-type` the type of the service you would like to use in your override.

Example for setting up MariaDB\_Galera:

```yaml title=".lagoon.yml"
environments:
  develop:
    types:
      mariadb: mariadb-single
```

### **`environments.[name].templates`**

The Lagoon build process checks the `lagoon.template` label from the `docker-compose.yml` file in order to check if the service needs a custom template file \(read more about them in the [documentation of `docker-compose.yml`](docker-compose-yml.md)\).

Sometimes you might want to override the **template** just for a single environment, and not for all of them:

`service-name: template-file`

* `service-name` is the name of the service from `docker-compose.yml` you would like to override.
* `template-file` is the path and name of the template to use for this service in this environment.

**Example**:

```yaml title=".lagoon.yml"
environments:
  main:
    templates:
      mariadb: mariadb.main.deployment.yml
```

### `environments.[name].rollouts`

The Lagoon build process checks the `lagoon.rollout` label from the `docker-compose.yml` file in order to check if the service needs a special rollout type \(read more about them in the [documentation of `docker-compose.yml`](docker-compose-yml.md#custom-rollout-monitor-types)\)

Sometimes you might want to override the **rollout type** just for a single environment, especially if you also overwrote the template type for the environment:

`service-name: rollout-type`

* `service-name` is the name of the service from `docker-compose.yml` you would like to override.
* `rollout-type` is the type of rollout. See [documentation of `docker-compose.yml`](docker-compose-yml.md#custom-rollout-monitor-types)\) for possible values.

**Example:**

```yaml title=".lagoon.yml"
environments:
  main:
    rollouts:
      mariadb: statefulset
```

### `environments.[name].autogenerateRoutes`

This allows for any environments to get autogenerated routes when route autogeneration is disabled.

```yaml title=".lagoon.yml"
routes:
  autogenerate:
    enabled: false
environments:
  develop:
    autogenerateRoutes: true
```

### `Cron jobs - environments.[name].cronjobs`

<iframe width="560" height="315" src="https://www.youtube.com/embed/Yd_JfDyfbR0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

As most of the time it is not desirable to run the same cron jobs across all environments, you must explicitly define which jobs you want to run for each environment.

**Example:**

```yaml title=".lagoon.yml"
    cronjobs:
     - name: drush cron
       schedule: "M * * * *" # This will run the cron once per hour.
       command: drush cron
       service: cli
```

* `name:`
  * Just a friendly name for identifying what the cron job will do.
* `schedule:`
  * The schedule for executing the cron job. This follows the standard convention of cron. If you're not sure about the syntax, [Crontab Generator](https://crontab.guru/) can help.
  * You can specify `M` for the minute, and your cron job will run once per hour at a random minute \(the same minute each hour\), or `M/15` to run it every 15 mins, but with a random offset from the hour \(like `6,21,36,51`\). It is a good idea to spread out your cron jobs using this feature, rather than have them all fire off on minute `0`.
  * You can specify `H` for the hour, and your cron job will run once per day at a random hour \(the same hour every day\), or `H(2-4)` to run it once per day within the hours of 2-4.
    * Notes on timezones:
      * The default timezone for cron jobs is UTC.
      * Native cron jobs will run in timezone of the node, which is UTC.
      * In-pod cron jobs == timezone of the pod it is running in, which defaults to UTC but may be different if you have configured it.
* `command:`
  * The command to execute. Like the tasks, this executes in the `WORKDIR` of the service. For Lagoon images, this is `/app`.
* `service:`
  * Which service of your project to run the command in. For most projects, this is the `CLI` service.

## Polysite

In Lagoon, the same Git repository can be added to multiple projects, creating what is called a polysite. This allows you to run the same codebase, but allow for different, isolated, databases and persistent files. In `.lagoon.yml` , we currently only support specifying custom routes for a polysite project. The key difference from a standard project is that the `environments` becomes the second-level element, and the project name the top level.

**Example:**

```yaml title=".lagoon.yml"
example-project-name:
  environments:
    main:
      routes:
        - nginx:
          - example.com
```

## Specials

### `api`

!!! Note "Note:"
    If you run directly on amazee.io hosted Lagoon you will not need this key set.

With the key `api` you can define another URL that should be used by the Lagoon CLI and `drush` to connect to the Lagoon GraphQL API. This needs to be a full URL with a scheme, like: `http://localhost:3000` This usually does not need to be changed, but there might be situations where your Lagoon administrator tells you to do so.

### `ssh`

!!! Note "Note:"
    If you run directly on amazee.io hosted Lagoon you will not need this key set.

With the key `ssh` you can define another SSH endpoint that should be used by the Lagoon CLI and `drush` to connect to the Lagoon remote shell service. This needs to be a hostname and a port separated by a colon, like: `localhost:2020` This usually does not need to be changed, but there might be situations where your Lagoon administrator tells you to do so.

### `additional-yaml`

The `additional-yaml` has some super powers. Basically, it allows you to define any arbitrary YAML configuration file to be inserted before the build step \(it still needs to be valid Kubernetes/OpenShift YAML, though ☺\).

Example:

```yaml title=".lagoon.yml"
additional-yaml:
  secrets:
    path: .lagoon.secrets.yml
    command: create
    ignore_error: true

  logs-db-secrets:
    path: .lagoon.logs-db-secrets.yml
    command: create
    ignore_error: true
```

Each definition is keyed by a unique name \(`secrets` and `logs-db-secrets` in the example above\), and takes these keys:

* `path` - the path to the YAML file.
* `command` - can either be `create` or `apply`, depending on whether you want to run. `kubectl create -f [yamlfile]` or `kubectl apply -f [yamlfile]`.
* `ignore_error` - either `true` or `false` \(default\).  This allows you to instruct the Lagoon build script to ignore any errors that might be returned during running the command. \(This can be useful to handle the case where you want to run `create` during every build, so that new configurations are created, but don't fail if they already exist\).

### `container-registries`

The `container-registries` block allows you to define your own private container registries to pull custom or private images. To use a private container registry, you will need a `username`, `password`, and optionally the `url` for your registry. If you don't specify a `url` in your YAML, it will default to using Docker Hub.

There are 2 ways to define the password used for your registry user.

* Create an environment variable in the Lagoon API \(see more on [Environment Variables](../using-lagoon-advanced/environment-variables.md)\). The name of the variable you create can then be set as the password:
* Define it directly in the `.lagoon.yml` file in plain text:

```yaml
container-registries:
  my-custom-registry:
    username: myownregistryuser
    password: MY_OWN_REGISTRY_PASSWORD
    url: my.own.registry.com
```

```yaml title=".lagoon.yml"
container-registries:
  docker-hub:
    username: dockerhubuser
    password: MySecretPassword
```

### Consuming a custom or private container registry image

To consume a custom or private container registry image, you need to update the service inside your `docker-compose.yml` file to use a build context instead of defining an image:

```yaml title=".docker-compose.yml"
services:
  mariadb:
    build:
      context: .
      dockerfile: Dockerfile.mariadb
```

Once the `docker-compose.yml` file has been updated to use a build, you need to create the `Dockerfile.<service>` and then set your private image as the `FROM <repo>/<name>:<tag>`

```text
FROM dockerhubuser/my-private-database:tag
```

## Example `.lagoon.yml`

This is an example `.lagoon.yml` which showcases all possible settings. You will need to adapt it to your project.

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
  autogenerate:
    insecure: Redirect

environments:
  main:
    monitoring_urls:
      - "https://www.example.com"
      - "https://www.example.com/special_page"
    routes:
      - nginx:
        - example.com
        - example.net
        - "www.example.com":
            tls-acme: 'true'
            insecure: Redirect
            hsts: max-age=31536000
        - "example.ch":
            annotations:
              nginx.ingress.kubernetes.io/permanent-redirect: https://www.example.ch$request_uri
        - www.example.ch
    types:
      mariadb: mariadb
    templates:
      mariadb: mariadb.main.deployment.yml
    rollouts:
      mariadb: statefulset
    cronjobs:
      - name: drush cron
        schedule: "M * * * *" # This will run the cron once per hour.
        command: drush cron
        service: cli
  staging:
      cronjobs:
      - name: drush cron
        schedule: "M * * * *" # This will run the cron once per hour.
        command: drush cron
        service: cli
  feature/feature-branch:
      cronjobs:
      - name: drush cron
        schedule: "H * * * *" # This will run the cron once per hour.
        command: drush cron
        service: cli
```
