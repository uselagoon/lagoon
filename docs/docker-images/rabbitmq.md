# RabbitMQ

The [Lagoon RabbitMQ Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/rabbitmq) with management plugin installed. Based on the official `rabbitmq:3-management` image at [docker-hub](https://hub.docker.com/_/rabbitmq).

This Dockerfile is intended to be used to set up a standalone RabbitMQ queue broker, as well as a base image to set up a cluster with high availability queue support by default \([Mirrored queues](https://www.rabbitmq.com/ha.html)\).

By default, the RabbitMQ broker is started as single node. If you want to start a cluster, you need to use the [`rabbitmq-cluster`](https://github.com/amazeeio/lagoon/blob/master/images/rabbitmq-cluster/Dockerfile) Docker image, based on `rabbitmq` image plus the `rabbitmq_peer_discovery_k8s` plugin.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions), so this image will work with a random user.
* The file `/etc/rabbitmq/definitions.json` is parsed through [`envplate`](https://github.com/kreuzwerker/envplate) with a container-entrypoint.

## Included RabbitMQ default schema \(definitions.json\)

* To enable the support for Mirrored Queues, at least one [`policy`](https://www.rabbitmq.com/parameters.html#policies)must exist.
* In the `definitions.json` schema file, minimal entities are defined to make the

  container run: `virtualhost` \(`vhost`\), `username` , and `password` to access management

  UI, `permissions` , and `policies`.

By default, a policy called `lagoon-ha` is created at startup, but it is not active because it doesn't match any queue's name pattern \(see default [Environment Variables](rabbitmq.md#environment-variables)\).

{% tabs %}
{% tab title="definitions.json" %}
```javascript
"policies":[
        {"vhost":"${RABBITMQ_DEFAULT_VHOST}","name":"lagoon-ha","pattern":"${RABBITMQ_DEFAULT_HA_PATTERN}", "definition":{"ha-mode":"exactly","ha-params":2,"ha-sync-mode":"automatic","ha-sync-batch-size":5}}
  ]
```
{% endtab %}
{% endtabs %}

By default, the `ha-mode` is set to `exactly` which controls the exact number of mirroring nodes for a queue \(mirrors\). The number of nodes is controller by `ha-params`.

For further information and custom configuration, please refer to [official RabbitMQ documentation](https://www.rabbitmq.com/ha.html).

## Environment Variables

Environment variables defined in RabbitMQ base image:

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `RABBITMQ_DEFAULT_USER` | guest | Username for management UI access. |
| `RABBITMQ_DEFAULT_PASS` | guest | Password for management UI access. |
| `RABBITMQ_DEFAULT_VHOST` | / | RabbitMQ main virtualhost. |
| `RABBITMQ_DEFAULT_HA_PATTERN` | ^$ | Regular expression to match for mirrored queues. |

