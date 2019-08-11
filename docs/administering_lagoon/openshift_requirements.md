# OpenShift Requirements by Lagoon

Lagoon tries to run on a standard installation of OpenShift as possible, but it expects some things:


### OpenShift Version

Currently Lagoon is tested and supported with OpenShift 3.9.

### Permissions

In order to setup Lagoon in an OpenShift you need a cluster-admin account to run the initial setup via `make lagoon-kickstart`. With this Lagoon will create it's own Roles and Permissions and the cluster-admin is not needed anymore.

### PV StorageClasses

For deployment projects by Lagoon the following StorageClasses will be needed:

| Name | Used for | Description  |
| -----| ------ |------|
| default | Single Pod mounts (mariadb, solr) | The default StorageClass will be used for any single pod mounts like mariadb, solr, etc. Suggested to use SSD based Storage |
| `bulk` | multi pod mounts (drupal files) | `bulk` StorageClass will be used whenever a project requests storage that needs to be mounted into multiple pods at the same time. Like nginx-php-persistent which will mount the same PVC in all nginx-php pods. Suggested to be on SSD but not required. |

Lagoon itself will create PVCs with the following StorageClasses:

| Name | Used for | Description  |
| -----| ------ |------|
| `lagoon-elasticsearch` | `logs-db` | `logs-db` will create PVCs with the storageClass name `lagoon-elasticsearch` for persistent storage of the elasticsearch. Standard deployments of `logs-db` create an Elasticsearch Cluster with 3 `live` nodes. Strongly suggested to be on SSD. |
| `lagoon-logs-db-archive` | `logs-db` | Beside the `live` nodes, `logs-db` also creates 3 `archive` nodes. These are used for elasticsearch data which is older than 1 month. Therefore it should be much bigger than `lagoon-elasticsearch` but can run on regular HDD. |
| `lagoon-logs-forwarder` | `logs-forwarder` | Used by `logs-forwarder` fluentd to provide a persistent buffer. Default configurations of Lagoon create 3 `logs-forwarder` pods. Preferred to be on SSD, but not needed. |

