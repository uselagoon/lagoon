# Service Types

This table lists all service types that can be defined via `lagoon.type` within a [`docker-compose.yml` file](../using-lagoon-the-basics/docker-compose-yml.md).

💡 _Tip: Scroll right to see the whole table!_

| Type | Description | Healthcheck | Exposed Ports | Auto generated routes | Storage | Additional customization parameters |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `cli` | Use for any kind of CLI container \(like PHP, Node.js, etc.\). Automatically gets the customer SSH private key that is mounted in `/var/run/secrets/lagoon/sshkey/ssh-privatekey`. | - | No | No | No | - |
| `cli-persistent` | Like `cli`, expects `lagoon.persistent.name` to be given the name of a service that has persistent storage, which will be mounted under defined `lagoon.persistent` label. Does NOT generate its own persistent storage, only used to mount another service's persistent storage. | - | No | No | Yes | `lagoon.persistent.name`, `lagoon.persistent` |
| `elasticsearch` | Elasticsearch container, will auto-generate persistent storage under `/usr/share/elasticsearch/data`. | HTTP on `localhost:9200/_cluster/health?local=true` | `9200` | No | Yes | `lagoon.persistent.size` |
| `kibana` | Kibana container. | TCP connection on `5601` | `5601` | Yes | No | - |
| `logstash` | Logstash container. | TCP connection on `9600` | `9600` | No | No | - |
| `mariadb` | A meta-service which will tell Lagoon to automatically decide between `mariadb-single` and `mariadb-dbaas`. | - | - | - | - | - |
| `mariadb-single` | MariaDB container. Creates cron job for backups running every 24h executing `/lagoon/mysql-backup.sh 127.0.0.1`. | TCP connection on `3306` | `3306` | No | Yes | `lagoon.persistent.size` |
| `mariadb-dbaas` | Uses a shared MariaDB server via the DBaaS Operator. | Not Needed | `3306` | No | - | - |
| `mongo` | A meta-service which will tell Lagoon to automatically decide between `mongo-single` and `mongo-dbaas`. | - | - | - | - | - |
| `mongo-single` | MongoDB container, will generate persistent storage of min 1GB mounted at `/data/db`. | TCP connection on `27017` | `27017` | No | Yes | `lagoon.persistent.size` |
| `mongo-dbaas` | Uses a shared MongoDB server via the DBaaS Operator. | Not Needed | `27017` | No | - | - |
| `nginx` | Nginx container. No persistent storage. | `localhost:50000/nginx_status` | `8080` | Yes | No | - |
| `nginx-php` | Like `nginx`, but additionally a `php` container. | Nginx: `localhost:50000/nginx_status`, PHP: `/usr/sbin/check_fcgi` | `8080` | Yes | No | - |
| `nginx-php-persistent` | Like `nginx-php.` Will generate persistent storage, defines mount location via `lagoon.persistent`. | Nginx: `localhost:50000/nginx_status`, PHP: `/usr/sbin/check_fcgi` | http on `8080` | Yes | Yes | `lagoon.persistent`, `lagoon.persistent.name`, `lagoon.persistent.size`, `lagoon.persistent.class` |
| `node` | Node.js container. No persistent storage. | TCP connection on `3000` | `3000` | Yes | No | - |
| `node-persistent` | Like `node`. Will generate persistent storage, defines mount location via `lagoon.persistent`. | TCP connection on `3000` | `3000` | Yes | Yes | `lagoon.persistent`, `lagoon.persistent.name`, `lagoon.persistent.size`, `lagoon.persistent.class` |
| `none` | Instructs Lagoon to completely ignore this service. | - | - | - | - | - |
| `postgres` | A meta-service which will tell Lagoon to automatically decide between `postgres-single` and `postgres-dbaas`. | - | - | - | - | - |
| `postgres-single` | Postgres container. Creates cron job for backups running every 24h executing `/lagoon/postgres-backup.sh localhost`. | TCP connection on `5432` | `5432` | No | Yes | `lagoon.persistent.size` |
| `postgres-dbaas` | Uses a shared PostgreSQL server via the DBaaS Operator. | Not Needed | `5432` | No | - | - |
| `python` | Python container. No persistent storage. | HTTP connection on `8800` | `8800` | Yes | No | - |
| `python-persistent` | Python container. With persistent storage. | HTTP connection on `8800` | `8800` | Yes | Yes | - |
| `redis` | Redis container. | TCP connection on `6379` | `6379` | No | No | - |
| `redis-persistent` | Redis container with auto-generated persistent storage mounted under `/data`. | TCP connection on `6379` | `6379` | No | Yes | `lagoon.persistent.size` |
| `solr` | Solr container with auto-generated persistent storage mounted under `/var/solr`. | TCP connection on `8983` | `8983` | No | Yes | `lagoon.persistent.size` |
| `varnish` | Varnish container. | HTTP request `localhost:8080/varnish_status` | `8080` | Yes | No | - |
| `varnish-persistent` | Varnish container with auto-generated persistent storage mounted under `/var/cache/varnish`. | HTTP request `localhost:8080/varnish_status` | `8080` | Yes | Yes | `lagoon.persistent.size` |

