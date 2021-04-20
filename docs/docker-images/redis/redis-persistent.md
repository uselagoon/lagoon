# Redis-persistent

The [Lagoon `redis-persistent` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/redis-persistent/5.Dockerfile). Based on the [Lagoon `redis` image](./), it is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).

It differs from `redis` only for `FLAVOR` environment variable.

