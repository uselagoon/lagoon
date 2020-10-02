# Service Types

This table lists all service types that can be defined via `lagoon.type` within a [`docker-compose.yml` file](../using-lagoon-the-basics/docker-compose-yml.md).

💡 _Tip: Scroll right to see the whole table!_

| Type | Description | Healthcheck | Exposed Ports | Auto generated routes | Additional customization parameters |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cli` | Use for any kind of CLI container \(like PHP, Node.js, etc.\). Automatically gets the customer SSH private key that is mounted in `/var/run/secrets/lagoon/sshkey/ssh-privatekey`. | - | - | - |  |
| `cli-persistent` | Like `cli`, expects `lagoon.persistent.name` to be given the name of a service that has persistent storage, which will be mounted under defined `lagoon.persistent` label. Does NOT generate its own persistent storage, only used to mount another service's persistent storage. | - | - | `lagoon.persistent.name`, `lagoon.persistent` |  |
| `custom` | Full custom definition, see [documentation](../using-lagoon-the-basics/docker-compose-yml.md#custom-type). | - | - | - | - |
| `elasticsearch` | Elasticsearch container, will auto-generate persistent storage under `/usr/share/elasticsearch/data`. | HTTP on `localhost:9200/_cluster/health?local=true` | `9200` | - | `lagoon.persistent.size` |
| `elasticsearch-cluster` | Elasticsearch cluster with 3 nodes, uses [`Statefulset`](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/), will auto-generate persistent storage for each cluster node under `/usr/share/elasticsearch/data`. | HTTP on `localhost:9200/_cluster/health?local=true` | `9200`, `9300` | - | - |
| `kibana` | Kibana container. | TCP connection on `5601` | `5601` | yes | - |
| `logstash` | Logstash container. | TCP connection on `9600` | `9600` | - | - |
| `mariadb` | A meta-service which will tell Lagoon to automatically decide between `mariadb-single` and `mariadb-shared`. | - | - | - | - |
| `mariadb-galera` | MariaDB Galera cluster with 3 nodes, uses [`Statefulset`](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/). Generates persistent storage for each cluster node. Creates cron job for backups running every 24h executing `/lagoon/mysql-backup.sh 127.0.0.1`. Starts additional `maxscale` container where the service points to \(no direct connection to Galera nodes\). | TCP connection on `3306` | `3306` | - | `lagoon.persistent.size` |
| `mariadb-shared` | Uses a shared MariaDB server via a MariaDB service broker. | Not Needed | `3306` | - | - |
| `mariadb-single` | MariaDB container. Creates cron job for backups running every 24h executing `/lagoon/mysql-backup.sh 127.0.0.1`. | TCP connection on `3306` | `3306` | - | `lagoon.persistent.size` |
| `mongo` | MongoDB container, will generate persistent storage of min 1GB mounted at `/data/db`. | TCP connection on `27017` | `27017` | - | - |
| `mongo-shared` | Uses a shared MongoDB server via a service broker. | Not Needed | `27017` | - | - |
| `nginx` | Nginx container. No persistent storage. | `localhost:50000/nginx_status` | `8080` | yes | - |
| `nginx-php` | Like `nginx`, but additionally a `php` container. | Nginx: `localhost:50000/nginx_status`, PHP: `/usr/sbin/check_fcgi` | `8080` | yes | - |
| `nginx-php-persistent` | Like `nginx-php.` Will generate persistent storage, defines mount location via `lagoon.persistent`. | Nginx: `localhost:50000/nginx_status`, PHP: `/usr/sbin/check_fcgi` | http on `8080` | yes | `lagoon.persistent`, `lagoon.persistent.name`, `lagoon.persistent.size`, `lagoon.persistent.class` |
| `node` | Node.js container. | TCP connection on `3000` | `3000` | yes | - |
| `node-persistent` | Like `node`. Will generate persistent storage, defines mount location via `lagoon.persistent`. | TCP connection on `3000` | `3000` | yes | `lagoon.persistent`, `lagoon.persistent.name`, `lagoon.persistent.size`, `lagoon.persistent.class` |
| `none` | Instructs Lagoon to completely ignore this service. | - | - | - | - |
| `postgres` | Postgres container. Creates cron job for backups running every 24h executing `/lagoon/postgres-backup.sh localhost`. | TCP connection on `5432` | `5432` | - | `lagoon.persistent.size` |
| `python-ckandatapusher` | Python CKAN DataPusher container. | TCP connection on `8800` | `8800` | yes | - |
| `redis` | Redis container. | TCP connection on `6379` | `6379` | - | - |
| `solr` | Solr container with auto-generated persistent storage mounted under `/opt/solr/server/solr/mycores`. | TCP connection on `8983` | `8983` | - | - |
| `varnish` | Varnish container. | HTTP request `localhost:8080/varnish_status` | `8080` | yes | - |

