---
description: >-
  Lagoon tries to run on as standard an installation of OpenShift as possible,
  but it expects some things:
---

# OpenShift Requirements

## OpenShift Version

Currently Lagoon is tested and supported with OpenShift 3.11.

## Permissions

In order to set up Lagoon in an OpenShift, you need a cluster-admin account to run the initial setup via `make lagoon-kickstart`. With this, Lagoon will create its own roles and permissions and the cluster-admin is not needed anymore.

## PV StorageClasses

For deployment projects by Lagoon the following StorageClasses will be needed:

| Name | Used for | Description |
| :--- | :--- | :--- |
| default | Single pod mounts \(MariaDB, Solr\) | The default StorageClass will be used for any single pod mounts like MariaDB, Solr, etc. We suggest using SSD-based storage. |
| `bulk` | Multi-pod mounts \(Drupal files\) | `bulk` StorageClass will be used whenever a project requests storage that needs to be mounted into multiple pods at the same time. Like `nginx-php-persistent`, which will mount the same PVC in all `nginx-php` pods. We suggest putting these on SSD, but it's not required. |

Lagoon itself will create PVCs with the following StorageClasses:

| Name | Used for | Description |
| :--- | :--- | :--- |
| `lagoon-elasticsearch` | `logs-db` | `logs-db` will create PVCs with the StorageClass name `lagoon-elasticsearch` for persistent storage of Elasticsearch. Standard deployments of `logs-db` create an Elasticsearch cluster with 3 `live` nodes. Strongly putting these on SSD. |
| `lagoon-logs-db-archive` | `logs-db` | Beside the `live` nodes, `logs-db` also creates 3 `archive` nodes. These are used for Elasticsearch data which is older than 1 month. Therefore it should be much bigger than `lagoon-elasticsearch` , but can run on regular HDD. |
| `lagoon-logs-forwarder` | `logs-forwarder` | Used by `logs-forwarder` fluentd to provide a persistent buffer. Default configurations of Lagoon create 3 `logs-forwarder` pods. We prefer to put these on SSD, but it's not needed. |

