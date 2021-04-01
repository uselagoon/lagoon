<p align="center">
  <img src="./Lagoon_OG.png" alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut" width="40%">
</p>

# Lagoon - the developer-focused application delivery platform

Lagoon solves what developers are dreaming about: A system that allows developers to locally develop their code and their services with Docker and run the exact same system in production. The same Docker images, the same service configurations and the same code.

Lagoon is fully open-source, built on open-source tools, built collaboratively with our users.



## Installing Lagoon

Note that is not necessary to install Lagoon on to your local machine if you are looking to maintain websites hosted on Lagoon.

Lagoon can be installed:

- Locally (for testing, debugging or development) using [Helm](https://helm.sh/) charts and [kind](https://kind.sigs.k8s.io/)
- Into your managed Kubernetes cloud provider of choice - we've tested it on [Amazon Elastic Kubernetes Service](https://aws.amazon.com/eks/), [Azure Kubernetes Service](https://azure.microsoft.com/en-au/services/kubernetes-service/), [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine/), but we are confident that it will also run on any other managed Kubernetes service.

For more information on developing or contributing to Lagoon, head to https://docs.lagoon.sh/lagoon/contributing-to-lagoon

For more information on installing and administering Lagoon, head to https://docs.lagoon.sh/lagoon/administering-lagoon



## Lagoon architecture

Lagoon is comprised of two main components, Lagoon Core and Lagoon Remote, and a number of other third-party services, Operators and Controllers.  In a full production setting, it is envisaged that Lagoon Core and Remote are installed into different Kubernetes Clusters (one Core can serve many Remotes), but they can also be installed into the same cluster if required.  Additionally, in advanced situations, a Lagoon Remote can contain multiple build-deploy controllers, connected to different Lagoon Cores (but this is only really recommended for testing purposes).

All communication between Lagoon Core and Lagoon Remote happens via RabbitMQ message queues, GraphQL or REST APIs.  Lagoon Core does not require administrator-level access to Lagoon Remote clusters.

### Lagoon Core

All the services that handle the API, authentication and external communication are installed here.  Installation is via a [Helm Chart](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-core)
- API
  - [api](https://github.com/amazeeio/lagoon/tree/main/services/api) (the GraphQL API that powers Lagoon)
  - [api-db](https://github.com/amazeeio/lagoon/tree/main/services/api-db) (the MariaDB storage for the API)
  - [api-redis](https://github.com/amazeeio/lagoon/tree/main/services/api-redis) (the cache layer for API queries)
- Authentication
  - [keycloak](https://github.com/amazeeio/lagoon/tree/main/services/keycloak) (the main authentication application)
  - [keycloak-db](https://github.com/amazeeio/lagoon/tree/main/services/keycloak-db) (the MariaDB storage for Keycloak)
- Messaging
  - [broker](https://github.com/amazeeio/lagoon/tree/main/services/broker) (the RabbitMQ message service used to communicate with Lagoon Remote)
  - [webhooks2tasks](https://github.com/amazeeio/lagoon/tree/main/services/webhooks2tasks) (the service that converts incoming webhooks to API updates)
  - [controllerhandler](https://github.com/amazeeio/lagoon/tree/main/services/controllerhandler) (the service that relays build progress from the controllers)
- Webhooks
  - [webhook-handler](https://github.com/amazeeio/lagoon/tree/main/services/webhook-handler) (the external service that Git Repositories and Registries communicate with)
- Notifications
  - [logs2email](https://github.com/amazeeio/lagoon/tree/main/services/logs2email) (the service that pushes build notifications to a nominated email address)
  - [logs2slack](https://github.com/amazeeio/lagoon/tree/main/services/logs2slack) (the service that pushes build notifications to a nominated Slack (or Discord) channel)
  - [logs2rocketchat](https://github.com/amazeeio/lagoon/tree/main/services/logs2rocketchat) (the service that pushes build notifications to a nominated Rocket Chat channel)
  - [logs2microsoftteams](https://github.com/amazeeio/lagoon/tree/main/services/logs2microsoftteams) (the service that pushes build notifications to a nominated Microsoft Teams channel)
- Other Services
  - [ssh](https://github.com/amazeeio/lagoon/tree/main/services/ssh) (provides developers with ssh access to the sites hosted on Lagoon)
  - [drush-alias](https://github.com/amazeeio/lagoon/tree/main/services/drush-alias) (provides Drupal developers with an automated alias service for Drush)
  - [ui](https://github.com/amazeeio/lagoon/tree/main/services/ui) (the main user interface and dashboard for Lagoon)

### Lagoon Remote

All the services that are used to provision, deploy and maintain sites hosted on Lagoon live here.  These services are mostly comprised of third-party tools, developed external to Lagoon itself.  Installation is via a [Helm Chart](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-remote)

- [Lagoon Build Deploy](https://github.com/amazeeio/lagoon-kbd) (the controllers that handle building and deploying sites onto Lagoon)
- [docker-host](https://github.com/amazeeio/lagoon/tree/main/images/docker-host) (the service that stores and caches upstream docker images)
- [Dioscuri](https://github.com/amazeeio/dioscuri) (optional operator that provides Active/Standby functionality to Lagoon)
- [dbaas-operator](https://github.com/amazeeio/dbaas-operator) (optional operator that provisions databases from an underlying managed database)

### Additional Services

These services are usually installed alongside either Lagoon Core or Lagoon Remote to provide additional functionality to Lagoon.

- Registry (required)
  - [Harbor](https://goharbor.io/) (provides image registry services to Lagoon projects)
  - [Trivy](https://github.com/aquasecurity/trivy) (scans images for vulnerability, and can report to Lagoon)

- Lagoon Logging (optional)
  - [lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging) (utilizes [banzaicloud/logging-operator](https://github.com/banzaicloud/logging-operator) to collect and augment container&router logs from all sites, and sends them to a logs-dispatcher)
  - [logs-dispatcher](https://github.com/amazeeio/lagoon/tree/main/services/logs-dispatcher) (collects application logs from sites, as well as container&router logs from lagoon-logging, enriches them with additional metadata and sends them to a central log concentrator)
  - [lagoon-logs-concentrator](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator) (collects logs from remote logs-dispatchers and sends them to Elasticsearch)
  
- Open Policy Agent (optional)

  - [lagoon-gatekeeper](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-gatekeeper) (centralized policy library for Lagoon)

- Elasticsearch (optional)
  - [Open Distro for Elasticsearch](https://opendistro.github.io/for-elasticsearch/) (provides centralized log storage, search and analysis)
  - [Kibana](https://opendistro.github.io/for-elasticsearch-docs/docs/kibana/) (the default user interface for Elasticsearch searching and visualization)

- Managed databases, for use with DBaaS operator (optional)
  - MariaDB (self managed or via [Amazon RDS for MariaDB](https://aws.amazon.com/rds/mariadb/), [Azure Database for MariaDB](https://docs.microsoft.com/en-us/azure/mariadb/#:~:text=Azure Database for MariaDB is,predictable performance and dynamic scalability.))

  - MySQL (self managed or via  [Amazon RDS for MySQL](https://aws.amazon.com/rds/mysql/), [Amazon Aurora MySQL](https://aws.amazon.com/rds/aurora/mysql-features/), [Azure Database for MySQL](https://azure.microsoft.com/en-au/services/mysql), [Cloud SQL for MySQL](https://cloud.google.com/sql/docs/mysql))

  - PostgreSQL (self managed or via [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/), [Amazon Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/postgresql-features/), [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql), [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres) )

  - MongoDB (self managed, or via [Amazon DocumentDB](https://aws.amazon.com/documentdb/), [Azure Cosmos DB](https://azure.microsoft.com/en-au/services/cosmos-db/) )



## Other Lagoon components

Here are a number of other repositories, tools and components used in Lagoon

### [Lagoon Images](https://github.com/uselagoon/lagoon-images)

Houses the base images used by projects hosted on Lagoon.  These images are regularly updated, and are not only used in hosted projects, they're used in Lagoon too!

To browse the full set of images, head to https://hub.docker.com/u/uselagoon

### [Lagoon Charts](https://github.com/uselagoon/lagoon-charts)

Houses all the Helm Charts used to deploy Lagoon, it comes with a built-in test suite.

To add the repository `helm repo add lagoon https://uselagoon.github.io/lagoon-charts/`

### [Lagoon Examples](https://github.com/uselagoon/lagoon-examples)

A meta-project that houses a wide range of example projects, ready-made for use on Lagoon.  These projects also include test suites that are used in the testing of the images.  Please request an example via that repository if you want to see a particular one, or even better, have a crack at making one!

### [amazee.io Charts](https://github.com/amazeeio/charts)

amazee.io has developed a number of tools, charts and operators designed to work with Lagoon and other Kubernetes services.

To add the repository `helm repo add lagoon https://amazeeio.github.io/charts/`



## Contribute

Do you want to contribute to Lagoon? Fabulous! [See our Documentation](https://docs.lagoon.sh/lagoon/contributing-to-lagoon/developing-lagoon) on how to get started.



## History

Lagoon was originally created and open sourced by the team at [amazee.io](https://www.amazee.io/) in August 2017, and powers their global hosting platform.



## Connect

Find more information about Lagoon:

At our website - https://lagoon.sh

In our documentation - https://docs.lagoon.sh

In our blog - https://dev.to/uselagoon

Via our socials - https://twitter.com/uselagoon