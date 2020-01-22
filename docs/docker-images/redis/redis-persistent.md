# redis-persistent

[Lagoon `redis-persistent` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/redis-persistent/Dockerfile), based on [Lagoon `redis` image](redis.md), is intended for use if the Redis service must be in `persistent` mode \(ie. with a persistent volume where transactions will be saved\).

It differs from `redis` only for `FLAVOR` environment variable.

