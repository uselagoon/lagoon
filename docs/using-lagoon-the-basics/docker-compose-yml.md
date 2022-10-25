# docker-compose.yml

The `docker-compose.yml` file is used by Lagoon to:

* Learn which services/containers should be deployed.
* Define how the images for the containers are built.
* Define additional configurations like persistent volumes.

Docker-compose \(the tool\) is very strict in validating the content of the YAML file, so we can only do configuration within `labels` of a service definition.

!!! warning "Warning:"
    Lagoon only reads the labels, service names, image names and build definitions from a `docker-compose.yml` file. Definitions like: ports, environment variables, volumes, networks, links, users, etc. are IGNORED.

This is intentional as the `docker-compose` file is there to define your local environment configuration. Lagoon learns from the `lagoon.type` the type of service you are deploying and from that knows about ports, networks and any additional configuration that this service might need.

Here a straightforward example of a `docker-compose.yml` file for Drupal:

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
    # Uncomment if you like to have the system behave like in production
    #LAGOON_ENVIRONMENT_TYPE: production
    # Uncomment to enable xdebug and then restart via `docker-compose up -d`
    #XDEBUG_ENABLE: "true"

x-user:
  &default-user
    # The default user under which the containers should run. Change this if you are on linux and run with another user than id `1000`
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

## Basic settings

`x-lagoon-project`:

This is the machine name of your project, define it here. We’ll use “drupal-example.”

`x-volumes`:

This tells Lagoon what to mount into the container. Your web application lives in `/app`, but you can add or change this if needed.

`x-environment`:

1. Here you can set your local development url. If you are using pygmy, it must end with `.docker.amazee.io`.
2. If you want to exactly mimic the production environment, uncomment `LAGOON_ENVIRONMENT_TYPE: production`.
3. If you want to enable xd-ebug, uncomment `DEBUG_ENABLE: "true"`.

`x-user`:

You are unlikely to need to change this, unless you are on Linux and would like to run with a user other than `1000`.

## **`services`**

This defines all the services you want to deploy. _Unfortunately,_ `docker-compose` calls them services, even though they are actually containers. Going forward we'll be calling them services, and throughout this documentation.

The name of the service \(`nginx`, `php`, and `mariadb` in the example above\) is used by Lagoon as the name of the Kubernetes pod \(yet another term - again, we'll be calling them services\) that is generated, plus also any additional Kubernetes objects that are created based on the defined `lagoon.type`, which could be things like services, routes, persistent storage, etc.

!!! warning "Warning:"
    Once you have set the name of a service, do NOT rename it. This will cause all kind of havoc in your containers and break things.

### Docker Images

#### **`build`**

If you want Lagoon to build a Dockerfile for your service during every deployment, you can define it here:

`build`

* `context`
  * The build context path that should be passed on into the `docker build` command.
* `dockerfile:`
  * Location and name of the Dockerfile that should be built.

!!! warning "Warning:"
    Lagoon does NOT support the short version of `build: <Dockerfile>` and will fail if it finds such a definition.

#### `image`

If you don't need to build a Dockerfile and just want to use an existing Dockerfile, define it via `image`.

### Types

Lagoon needs to know what type of service you are deploying in order to configure the correct Kubernetes or OpenShift objects.

This is done via the `lagoon.type` label. There are many different types to choose from. Check [Service Types](../using-lagoon-advanced/service-types.md) to see all of them and their additional configuration possibilities.

#### **Skip/Ignore containers**

If you'd like Lagoon to ignore a service completely - for example, you need a container only during local development - give it the type `none`.

### Persistent Storage

Some containers need persistent storage. Lagoon allows for each container to have a maximum of one persistent storage volume attached to the container. You can configure the container to request its own persistent storage volume (which can then be mounted by other container), or you can tell the container to mount the persistent storage created by another container. 

In many cases, Lagoon knows where that persistent storage needs to go. For example, for a MariaDB container, Lagoon knows that the persistent storage should be put into `/var/lib/mysql` , and puts it there automatically without any extra configuration to define that. For some situations, though, Lagoon needs your help to know where to put the persistent storage:

* `lagoon.persistent` - The **absolute** path where the persistent storage should be mounted \(the above example uses `/app/web/sites/default/files/` which is where Drupal expects its persistent storage\).
* `lagoon.persistent.name` - Tells Lagoon to not create a new persistent storage for that service, but instead mounts the persistent storage of another defined service into this service.
* `lagoon.persistent.size` - The size of persistent storage you require \(Lagoon usually gives you minimum 5G of persistent storage, if you need more, define it here\).
* `lagoon.persistent.class` - By default Lagoon automatically assigns the right storage class for your service \(like SSDs for MySQL, bulk storage for Nginx, etc.\). If you need to overwrite this, you can do so here. This is highly dependent on the underlying Kubernetes/OpenShift that Lagoon runs on. Ask your Lagoon administrator about this.

### Auto-generated Routes

The docker-compose.yml file also supports per-service enabling and disabling of [autogenerated routes](../using-lagoon-the-basics/lagoon-yml.md#routes)

* `lagoon.autogeneratedroute: false` label will stop a route from being automatically created for that service. It can be applied to all services with autogenerated routes, but is mostly useful for the [`basic`](../using-lagoon-advanced/service-types.md#basic) and [`basic-persistent`](../using-lagoon-advanced/service-types.md#basic-persistent) service types when used to create an additional internal-facing service for a database service or similar. The inverse is also true - it will enable an auto-generated route for a service when the .lagoon.yml file [disables them](lagoon-yml.md#routesautogenerateenabled).


## Multi-Container Pods

Kubernetes and OpenShift don't deploy plain containers. Instead, they deploy pods, with each one or more containers. Usually Lagoon creates a single pod with a container inside for each defined `docker-compose` service. For some cases, we need to put two containers inside a single pod, as these containers are so dependent on each other that they should always stay together. An example for such a situation is the PHP and Nginx containers that both contain PHP code of a web application like Drupal.

For these cases, it is possible to tell Lagoon which services should stay together, which is done in the following way \(remember that we are calling containers `services` because of `docker-compose`:

1. Define both services with a `lagoon.type` that expects two services \(in the example this is `nginx-php-persistent` defined on the `nginx` and `php` services\).
2. Link the second service with the first one, defining the label `lagoon.name` of the second one with the first one. \(in the example this is done with defining `lagoon.name: nginx`\).

This will cause Lagoon to realize that the `nginx` and `php` containers are combined in a pod that will be called `nginx`.

!!! warning "Warning:"
    Once you have set the `lagooon.name` of a service, do NOT rename it. This will cause all kind of havoc in your containers and break things.

Lagoon still needs to understand which of the two services is the actual individual service type \(`nginx` and `php` in this case\). It does this by searching for service names with the same name that are given by the type, so `nginx-php-persistent` expects one service with the name `nginx` and one with `php` in the `docker-compose.yml.` If for any reason you want to use different names for the services, or you need for than one pod with the type `nginx-php-persistent` there is an additional label `lagoon.deployment.servicetype` which can be used to define the actual service type.

An example:

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
      lagoon.name: nginx # We want this service be part of the nginx pod in Lagoon.
      lagoon.deployment.servicetype: php
```

In the example above, the services are named `nginx` and `php` \(but you can call them whatever you want\). The `lagoon.name` tells Lagoon which services go together - all of the services with the same name go together.

In order for Lagoon to realize which one is the `nginx` and which one is the `php` service, we define it via `lagoon.deployment.servicetype: nginx` and `lagoon.deployment.servicetype: php`.

## Helm Templates \(Kubernetes only\)

Lagoon uses [Helm](https://helm.sh/) for templating on Kubernetes. To do this, a series of [Charts](https://github.com/uselagoon/build-deploy-tool/tree/main/legacy/helmcharts) are included with the `build-deploy-tool` image.

## **Custom Rollout Monitor Types**

By default , Lagoon expects that services from custom templates are rolled out via a [`DeploymentConfig`](https://docs.openshift.com/container-platform/4.4/applications/deployments/what-deployments-are.html#deployments-and-deploymentconfigs_what-deployments-are) object within Kubernetes or Openshift. It monitors the rollout based on this object. In some cases, the services that are defined via custom deployment need a different way of monitoring. This can be defined via `lagoon.rollout`:

* `deploymentconfig` - This is the default. Expects a [`DeploymentConfig`](https://docs.openshift.com/container-platform/4.4/applications/deployments/what-deployments-are.html#deployments-and-deploymentconfigs_what-deployments-are) object in the template for the service.
* `statefulset` - Expects a [`Statefulset`](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) object in the template for the service.
* `daemonset` - Expects a [`Daemonset`](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) object in the template for the service.
* `false` - Will not monitor any rollouts, and will just be happy if the template applies and does not throw any errors.

You can also overwrite the rollout for just one specific environment. This is done in [`.lagoon.yml`](lagoon-yml.md#environments-name-rollouts).

