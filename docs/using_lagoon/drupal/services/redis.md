# Redis

We recommend using Redis for internal caching. Add the redis
service to `docker-compose.yaml`.

```
  redis:
    image: amazeeio/redis
    labels:
      lagoon.type: redis
    << : *default-user # uses the defined user from top
    environment:
      << : *default-environment
```

Also, to configure redis, add the following to your `settings.php`.


### Drupal 7
```
if(getenv('LAGOON')){
  $conf['redis_client_interface'] = 'PhpRedis';
  $conf['redis_client_host'] = 'redis';
  $conf['lock_inc'] = 'sites/all/modules/contrib/redis/redis.lock.inc';
  $conf['path_inc'] = 'sites/all/modules/contrib/redis/redis.path.inc';
  $conf['cache_backends'][] = 'sites/all/modules/contrib/redis/redis.autoload.inc';
  $conf['cache_default_class'] = 'Redis_Cache';
  $conf['cache_class_cache_form'] = 'DrupalDatabaseCache';
  $conf['cache_class_cache_field'] = 'DrupalDatabaseCache';
}
```

Depending on file system structure, the module paths may need to be updated.

### Drupal 8

The Drupal 8 config is largely stock. Notably, redis is disabled while drupal is being installed.

```
if (getenv('LAGOON')){
  $settings['redis.connection']['interface'] = 'PhpRedis';
  $settings['redis.connection']['host'] = getenv('REDIS_HOST') ?: 'redis';
  $settings['redis.connection']['port'] = getenv('REDIS_SERVICE_PORT') ?: '6379';
  $settings['cache_prefix']['default'] = getenv('LAGOON_PROJECT') . '_' . getenv('LAGOON_GIT_SAFE_BRANCH');

  // Do not set the cache during installations of Drupal
  if (!drupal_installation_attempted() && extension_loaded('redis')) {
    $settings['cache']['default'] = 'cache.backend.redis';

    // and allows to use it without the redis module being enabled.
    $class_loader->addPsr4('Drupal\\redis\\', 'modules/contrib/redis/src');

    $settings['bootstrap_container_definition'] = [
      'parameters' => [],
      'services' => [
        'redis.factory' => [
          'class' => 'Drupal\redis\ClientFactory',
        ],
        'cache.backend.redis' => [
          'class' => 'Drupal\redis\Cache\CacheBackendFactory',
          'arguments' => ['@redis.factory', '@cache_tags_provider.container', '@serialization.phpserialize'],
        ],
        'cache.container' => [
          'class' => '\Drupal\redis\Cache\PhpRedis',
          'factory' => ['@cache.backend.redis', 'get'],
          'arguments' => ['container'],
        ],
        'cache_tags_provider.container' => [
          'class' => 'Drupal\redis\Cache\RedisCacheTagsChecksum',
          'arguments' => ['@redis.factory'],
        ],
        'serialization.phpserialize' => [
          'class' => 'Drupal\Component\Serialization\PhpSerialize',
        ],
      ],
    ];
  }
}
```

### Persistent

Redis can also be configured as a persistent backend.

```
redis:
  image: amazeeio/redis-persistent
  labels:
    lagoon.type: redis-persistent
  environment:
    << : *default-environment
```

## Environment Variables
Environment variables are meant to do common behavior changes of redis.

| Environment Variable   | Default   | Description                                    |
| -----------------------| --------- | ---------------------------------------------- |
| `LOGLEVEL`             | `notice`  | Redis Loglevel                                 |
| `DATABASES`            | `1`       | Number of Databases                            |
| `MAXMEMORY`            | `100mb`   | Maximum Memory usage of Redis                  |
