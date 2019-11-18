# docker-compose.yml file
The `docker-compose.yml` (or also `docker-compose.yaml`) is used by Lagoon to:

* learn which services/containers should be deployed
* how the images for the containers are built
* additional configurations like persistent volumes

Docker-compose (the tool) is very strict in validating the content of the yaml file, so we can only do any configurations within `labels` of a service definition.

**Important**: Lagoon only reads the labels, service names, image names and build definitions from a docker-compose.yml file. Definitions like: Ports, Environment Variables, Volumes, Networks, Links, Users, etc. are IGNORED. This is intentional as the docker-compose file is there to define your local environment configuration. Lagoon learns from the `lagoon.type` the type of service you are deploying and from that knows about ports, networks and any additional configuration that this service might need.

Here an easy example of a docker-compose.yml file for Drupal:

```
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

#### `services`

This defines all your "services" you like to deploy. 'Unfortunately' docker-compose calls them services, even though they are actually containers.

The name of the service (`nginx`, `php`, `mariadb` in the example above) is used by Lagoon as the name of the Pod that is generated, plus also any additional Kubernetes Objects that are created based on the defines `lagoon.type`, which could be things like Services, Routes, PVCs, etc.

### Docker Images

#### `build`

If you would like Lagoon to build a Dockerfile for your service during every deployment, you can define it here:

`build`

* `context`
    * The build context path that should be passed on into the `docker build` command
* `dockerfile:`
    * Location and name of the Dockerfile that should be build

Important: Lagoon does NOT support the short version of `build: <Dockerfile>` and will fail if it finds such a definition.

#### `image`

If you don't need to build a Dockerfile and just want to use an existing Dockerfile, define it via `image`.

### Types

Lagoon needs to know what type of service you are deploying in order to configure the correct Kubernetes and OpenShift Objects.

This is done via the `lagoon.type` label. There are many different types to choose from, check [Service Types](service_types.md) to see all of them and their additional configuration possibilities.

#### Skip/Ignore containers

If you like Lagoon to ignore a service completely, like for the case that you need a container only during local development, just give it the type `none`.

### Persistent Storage

Some containers need persistent storage. While Lagoon knows for many service types where that persistent storage needs to go. For example for a mariadb container it knows that the persistent storage should be put into `/var/lib/mysql` and puts it there automatically with the need to define that.
For some situations though Lagoon needs your help to know where to put the persistent storage:

* `lagoon.persistent` - the **absolute** path where the persistent storage should be mounted (the above example uses `/app/web/sites/default/files/` which is where Drupal expects it's persistent storage)
* `lagoon.persistent.name` - tells Lagoon to not create a new persistent storage for that service, but instead mounts the persistent storage of another defined service into this service
* `lagoon.persistent.size` - the size of persistent storage you require (Lagoon usually gives you minimum `5G` of persistent storage, if you need more define it here)
* `lagoon.persistent.class` - by default Lagoon automatically assigns the right Storage Class for your service (like SSDs for mysql, Bulk Storage for Nginx, etc.). If you need to overwrite this, you can do so here. - This is highly depending on the underlining Kubernetes/OpenShift that Lagoon runs on. Ask your Lagoon Administrator about this.

### Multi Container Pods

Kubernetes and OpenShift don't deploy plain Containers, instead they deploy Pods, which each include a single or multiple containers. Usually Lagoon creates for each defined docker-compose service a single Pod with a Container inside. For some cases though, we need to put two containers inside a single pod, as these containers are so depending on each other, that they should always stay together. An example for such a situation is the PHP and Nginx container that both contain PHP code of a webapplication like Drupal.

For these cases it is possible to tell Lagoon which services should stay together, this is done the following way:

1. Define both services with a `lagoon.type` that expects two containers (in the example this is `nginx-php-persistent` defined on the `nginx` and `php` services)
2. Link the second service/container with the first one, with defining the label `lagoon.name` of the second one with the first one. (in the example this is done with defining `lagoon.name: nginx`).

This will cause Lagoon to realise that the `nginx` and `php` containers are combined in a Pod that will be called `nginx`.

Lagoon still needs to understand which of the two services are the actual individual service type (`nginx` and `php` in this case). It does this with searching for service names with the same name that are given by the type, so `nginx-php-persistent` expects a service with the name `nginx` and one with `php` in the docker-compose.yml. If for any reason you want to use different names for the services or you maybe need two pods with the type `nginx-php-persistent` there is an additional label `lagoon.deployment.servicetype` which can be used to define the actual service type.

An example:

```
  web:
    build:
      context: .
      dockerfile: nginx.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.name: nginx
      lagoon.deployment.servicetype: nginx
  phehaphe:
    build:
      context: .
      dockerfile: php.dockerfile
    labels:
      lagoon.type: nginx-php-persistent
      lagoon.persistent: /app/web/sites/default/files/
      lagoon.name: nginx
      lagoon.deployment.servicetype: php
```

As you can see the services are called `web` (which is the nginx container) and `phehaph` (which is Swiss-German for `php`). In order for Lagoon to realize which one is the `nginx` and which one is the `php` container, it is defined via `lagoon.deployment.servicetype: nginx` and `lagoon.deployment.servicetype: php`.

Additionally twice the `lagoon.name: nginx` is defined, which will cause Lagoon to give the Pod the name `nginx` and not `web` (Tip: Do not do this, it's way too confusing, name the things the same).


### Advanced Usage

#### Custom Templates

If you need some changes on the OpenShift Templates, you can define your own template via `lagoon.template`. Check out the shipped Templates from the [templates folder of `oc-build-deploy-dind`](https://github.com/amazeeio/lagoon/tree/master/images/oc-build-deploy-dind/openshift-templates). Important: The template is called with `oc process`, so you should define the same parameters like in the default templates.

You can also overwrite the templates only for a specific environment, this is done in the [`.lagoon.yml`](lagoon_yml.md#environmentsnametypes)

#### Custom Rollout Monitor Types

By default Lagoon expects that the way services from custom templates are rolled out is done via a `DeploymentConfig` object within Openshift/Kubernetes and monitors the rollout based on such object. In some cases the services that are defined via custom deployment need a different way of monitoring, this can be defined via `lagoon.rollout`:

- `deploymentconfig` (this is the default) - expects a `DeplomentConfig` object in the template for the service
- `statefulset` - expects a `Statefulset` object in the template for the service
- `daemonset` - expects a `Daemonset` object in the template for the service
- `false` - will not monitor any rollouts and just be happy of the template applies and does not throw any errors

You can also overwrite the rollout only for a specific environment, this is done in the [`.lagoon.yml`](lagoon_yml.md#environmentsnamerollouts)

#### Custom Type

Feeling adventurous and would like to do something completely customized? Welcome to the Danger-Zone!

With defining a service as `lagoon.type: custom`, you can tell Lagoon to not use any predefined service type templates and pass your full own custom yaml file.

This also expects the label `lagoon.template` to be defined with the path to the yaml file where you define all the needed Kubernetes Objects to be executed. In here you can define your own OpenShift Templates like they ones in the [templates folder of `oc-build-deploy-dind`](https://github.com/amazeeio/lagoon/tree/master/images/oc-build-deploy-dind/openshift-templates). Important: The template is called with `oc process`, so you should define the same parameters like in the default templates.

