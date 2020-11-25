# Redis-persistent

The [Lagoon `redis-persistent` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/redis-persistent/Dockerfile). Based on the [Lagoon `redis` image](./), it is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).

It differs from `redis` only for `FLAVOR` environment variable.

