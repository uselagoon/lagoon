<p align="center">
 <img src="./docs/images/lagoon-logo.png" alt="The Lagoon logo is a blue hexagon split in two pieces with an L-shaped cut" width="40%">
</p>

# Lagoon - the developer-focused application delivery platform for Kubernetes

## Table of Contents
1. Project Description
2. Usage
3. Architecture
4. Testing
5. Other Lagoon Components
6. Contribution
7. History
8. Connect

## Project Description

Lagoon solves what developers are dreaming about: A system that allows developers to locally develop their code and their services with Docker and run the exact same system in production. The same container images, the same service configurations and the same code.

> Lagoon is an application delivery **platform**. Its primary focus is as a cloud-native tool for the deployment, management, security and operation of many applications. Lagoon greatly reduces the requirement on developers of those applications to have cloud-native experience or knowledge.

Lagoon has been designed to handle workloads that have been traditionally more complex to make cloud-native (such as CMS, LMS, and other multi-container applications), and to do so with minimal retraining or reworking needed for the developers of those applications.

Lagoon is fully open-source, built on open-source tools, built collaboratively with our users.

## Usage
### Installation

*Note that is not necessary to install Lagoon on to your local machine if you are looking to maintain websites hosted on Lagoon.*

Lagoon can be installed:

- Locally (for evaluation, testing, debugging or development) using [Helm](https://helm.sh/) charts and [kind](https://kind.sigs.k8s.io/), [microk8s](https://microk8s.io/), [k3s](https://k3s.io/) or similar.
- Into your managed Kubernetes cloud provider of choice - it's running in production on [Amazon Elastic Kubernetes Service](https://aws.amazon.com/eks/), [Azure Kubernetes Service](https://azure.microsoft.com/en-au/services/kubernetes-service/), and [Google Kubernetes Engine](https://cloud.google.com/kubernetes-engine/), but we are confident that it will also run on any other managed Kubernetes service.

For more information on developing or contributing to Lagoon, head to https://docs.lagoon.sh/contributing

For more information on installing and administering Lagoon, head to https://docs.lagoon.sh/installing-lagoon/requirements/

### Architecture

Lagoon comprises two main components: **Lagoon Core** and **Lagoon Remote**. It's also built on several other third-party services, Operators and Controllers. In a full production setting, we recommend installing Lagoon Core and Remote into different Kubernetes Clusters. A single Lagoon Core installation is capable of serving multiple Remotes, but they can also be installed into the same cluster if preferred.

To enhance security, Lagoon Core does not need administrator-level access to the Kubernetes clusters that are running Lagoon Remote. All inter-cluster communication happens only via RabbitMQ. This is hosted in Lagoon Core, and consumed (and published back to) by Lagoon Remote. This allows Lagoon Remotes to be managed by different teams, in different locations - even behind firewalls or inaccessible from the internet.

Lagoon services are mostly built in Node.js. More recent development occurs in Go, and most of the automation and scripting components are in Bash.

### Lagoon Core

All the services that handle the API, authentication and external communication are installed here. Installation is via a [Helm Chart].(https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-core)
- API
  - [api](https://github.com/uselagoon/lagoon/tree/main/services/api) (the GraphQL API that powers Lagoon)
  - [api-db](https://github.com/uselagoon/lagoon/tree/main/services/api-db) (the MariaDB storage for the API)
  - [api-redis](https://github.com/uselagoon/lagoon/tree/main/services/api-redis) (the cache layer for API queries)
- Authentication
  - [keycloak](https://github.com/uselagoon/lagoon/tree/main/services/keycloak) (the main authentication application)
  - [keycloak-db](https://github.com/uselagoon/lagoon/tree/main/services/keycloak-db) (the MariaDB storage for Keycloak)
  - [auth-server](https://github.com/uselagoon/lagoon/tree/main/services/auth-server) (generates authentication tokens for Lagoon services)
  - [ssh](https://github.com/uselagoon/lagoon/tree/main/services/ssh) (provides developers with ssh access to the sites hosted on Lagoon)
- Messaging
  - [broker](https://github.com/uselagoon/lagoon/tree/main/services/broker) (the RabbitMQ message service used to communicate with Lagoon Remote)
  - [webhooks2tasks](https://github.com/uselagoon/lagoon/tree/main/services/webhooks2tasks) (the service that converts incoming webhooks to API updates)
  - [actions-handler](https://github.com/uselagoon/lagoon/tree/main/services/actions-handler) (the service that to manage bulk action processing for builds and tasks)
- Webhooks
  - [webhook-handler](https://github.com/uselagoon/lagoon/tree/main/services/webhook-handler) (the external service that Git Repositories and Registries communicate with)
  - [backup-handler](https://github.com/uselagoon/lagoon/tree/main/services/backup-handler) (the service used to collect and collate information on backups)
- Notifications
  - [logs2notifications](https://github.com/uselagoon/lagoon/tree/main/services/logs2notifications) (the service that pushes build notifications to a configured notification types)

### Lagoon Remote

All the services that are used to provision, deploy and maintain sites hosted by Lagoon on Kubernetes live here. These services are mostly comprised of third-party tools, developed external to Lagoon itself. Installation is via a [Helm Chart](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-remote)

- [Docker Host](https://github.com/uselagoon/lagoon-service-images/tree/main/docker-host) (the service that stores and caches upstream docker images for use in builds)
- [Storage Calculator](https://github.com/uselagoon/storage-calculator) (an optional service to collect the size of storage and databases)
- [Remote Controller](https://github.com/uselagoon/remote-controller) (the controllers that handle building and deploying sites onto Lagoon)
- [Build Deploy Tool](https://github.com/uselagoon/build-deploy-tool) (the service that computes which services, configuration and settings to provision for Kubernetes)
- [Aergia](https://github.com/uselagoon/aergia-controller) (an optional controller that can idle non-production sites not currently in use to conserve resources)
- [Dioscuri](https://github.com/amazeeio/dioscuri) (an optional operator that provides Active/Standby functionality to Lagoon)
- [DBaaS Operator](https://github.com/amazeeio/dbaas-operator) (an optional operator that provisions databases from an underlying managed database)

### Lagoon UI
  - [ui](https://github.com/uselagoon/lagoon-ui) (the main user interface and dashboard for Lagoon, usually installed in lagoon-core, but can also be installed anywhere as a Lagoon project)

### Lagoon Tools
  - [lagoon-cli](https://github.com/uselagoon/lagoon-cli) (the command-line interface for managing sites on Lagoon)
  - [lagoon-sync](https://github.com/uselagoon/lagoon-sync) (a command-line interface for syncing databases or file assets between Lagoon environments)
  - [drush-alias](https://github.com/uselagoon/lagoon-service-images/tree/main/drush-alias) (provides Drupal developers with an automated alias service for Drush)

### Additional Services

These services are usually installed alongside either Lagoon Core or Lagoon Remote to provide additional functionality to Lagoon.

- Registry (required)
  - [Harbor](https://goharbor.io/) (provides image registry services to Lagoon projects)
- Backups (optional)
  - [k8up](https://k8up.io/) (provides a scheduled backup and prune service to environment namespaces)
- Lagoon Logging (optional)
  - [lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging) (utilizes [banzaicloud/logging-operator](https://github.com/banzaicloud/logging-operator) to collect and augment container&router logs from all sites, and sends them to a logs-dispatcher)
  - [logs-dispatcher](https://github.com/uselagoon/lagoon-service-images/tree/main/logs-dispatcher) (collects application logs from sites, as well as container&router logs from lagoon-logging, enriches them with additional metadata and sends them to a central log concentrator)
  - [lagoon-logs-concentrator](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator) (collects logs from remote logs-dispatchers and sends them to Elasticsearch)
- Elasticsearch or Opensearch (optional)
  - [OpenSearch](https://opensearch.org/docs/latest/opensearch/index/) (provides centralized log storage, search and analysis)
  - [OpenSearch Dashboards](https://opensearch.org/docs/latest/dashboards/index/) (the default user interface for OpenSearch searching and visualization)
- Managed databases, for use with DBaaS operator (optional)
  - MariaDB (self managed or via [Amazon RDS for MariaDB](https://aws.amazon.com/rds/mariadb/), [Azure Database for MariaDB](https://azure.microsoft.com/en-au/services/mariadb/)
  - MySQL (self managed or via [Amazon RDS for MySQL](https://aws.amazon.com/rds/mysql/), [Amazon Aurora MySQL](https://aws.amazon.com/rds/aurora/mysql-features/), [Azure Database for MySQL](https://azure.microsoft.com/en-au/services/mysql), [Cloud SQL for MySQL](https://cloud.google.com/sql/docs/mysql))
  - PostgreSQL (self managed or via [Amazon RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/), [Amazon Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/postgresql-features/), [Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql), [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres) )
  - MongoDB (self managed, or via [Amazon DocumentDB](https://aws.amazon.com/documentdb/), [Azure Cosmos DB](https://azure.microsoft.com/en-au/services/cosmos-db/) )
- Open Policy Agent (optional)

## Testing

Lagoon has a comprehensive [test suite](https://github.com/uselagoon/lagoon/tree/main/tests/tests), designed to cover most end-user scenarios. The testing is automated in Ansible, and runs in Jenkins, but can also be run locally in a self-contained cluster. The testing provisions a standalone Lagoon cluster, running on Kind (Kubernetes in Docker). This cluster is made of Lagoon Core, Lagoon Remote, an image registry and a set of managed databases. It runs test deployments and scenarios for a range of Node.js, Drupal, Python and NGINX projects, all built using the latest Lagoon images.


## Other Lagoon components

Here are a number of other repositories, tools and components used in Lagoon

### [Lagoon Images](https://github.com/uselagoon/lagoon-images)

These images are used by developers to build web applications on, and come preconfigured for running on Lagoon as well as locally.  There are php, NGINX, Node.JS, Python (and more) variants. These images are regularly updated, and are not only used in hosted projects, they're used in Lagoon too!

To browse the full set of images, head to https://hub.docker.com/u/uselagoon

### [Lagoon Examples](https://github.com/uselagoon/lagoon-examples)

A meta-project that houses a wide range of example projects, ready-made for use on Lagoon. These projects also include test suites that are used in the testing of the images. Please request an example via that repository if you want to see a particular one, or even better, have a crack at making one!

### [Lagoon Charts](https://github.com/uselagoon/lagoon-charts)

Houses all the Helm Charts used to deploy Lagoon, it comes with a built-in test suite.

To add the repository `helm repo add lagoon https://uselagoon.github.io/lagoon-charts/`

### [amazee.io Charts](https://github.com/amazeeio/charts)

amazee.io has developed a number of tools, charts and operators designed to work with Lagoon and other Kubernetes services.

To add the repository `helm repo add lagoon https://amazeeio.github.io/charts/`



## Contribution

Do you want to contribute to Lagoon? Fabulous! [See our Documentation](https://docs.lagoon.sh/contributing/) on how to get started.



## History

Lagoon was originally created and open sourced by the team at [amazee.io](https://www.amazee.io/) in August 2017, and powers their global hosting platform.



## Connect

Find more information about Lagoon:

At our website - https://lagoon.sh

In our documentation - https://docs.lagoon.sh

In our blog - https://dev.to/uselagoon

Via our socials - https://twitter.com/uselagoon

On Discord -  https://discord.gg/te5hHe95JE
