<?php
/**
 * @file
 * amazee.io Drupal all environment configuration file.
 *
 * This file should contain all settings.php configurations that are needed by all environments.
 *
 * It contains some defaults that the amazee.io team suggests, please edit them as required.
 */

// Defines where the sync folder of your configuration lives. In this case it's inside
// the Drupal root, which is protected by amazee.io Nginx configs, so it cannot be read
// via the browser. If your Drupal root is inside a subfolder (like 'web') you can put the config
// folder outside this subfolder for an advanced security measure: '../config/sync'.
use Drupal\Core\Installer\InstallerKernel;

$settings['config_sync_directory'] = '../config/sync';

if (getenv('LAGOON_ENVIRONMENT_TYPE') !== 'production') {
    /**
     * Skip file system permissions hardening.
     *
     * The system module will periodically check the permissions of your site's
     * site directory to ensure that it is not writable by the website user. For
     * sites that are managed with a version control system, this can cause problems
     * when files in that directory such as settings.php are updated, because the
     * user pulling in the changes won't have permissions to modify files in the
     * directory.
     */
    $settings['skip_permissions_hardening'] = TRUE;
}

// Trusted Host Patterns.
// see https://www.drupal.org/node/2410395 for more information.
// If your site runs on multiple domains, you need to add these domains here.
// escape dots, remove schema, use commas as regex separator.
if (getenv('LAGOON_ROUTES')) {
    $patterns = str_replace(['.', 'https://', 'http://', ','], ['\.', '', '', '|'], getenv('LAGOON_ROUTES'));
    $settings['trusted_host_patterns'] = ['^' . $patterns . '$'];
  }

### Lagoon Solr connection.
// WARNING: you have to create a search_api server having "solr" machine name at
// /admin/config/search/search-api/add-server to make this work.
if (getenv('LAGOON')) {
    $config['search_api.server.solr']['backend_config']['connector_config']['host'] = getenv('SOLR_HOST') ?: 'solr';
    $config['search_api.server.solr']['backend_config']['connector_config']['path'] = '/';
    $config['search_api.server.solr']['backend_config']['connector_config']['core'] = getenv('SOLR_CORE') ?: 'drupal';
    $config['search_api.server.solr']['backend_config']['connector_config']['port'] = 8983;
    $config['search_api.server.solr']['backend_config']['connector_config']['http_user'] = (getenv('SOLR_USER') ?: '');
    $config['search_api.server.solr']['backend_config']['connector_config']['http']['http_user'] = (getenv('SOLR_USER') ?: '');
    $config['search_api.server.solr']['backend_config']['connector_config']['http_pass'] = (getenv('SOLR_PASSWORD') ?: '');
    $config['search_api.server.solr']['backend_config']['connector_config']['http']['http_pass'] = (getenv('SOLR_PASSWORD') ?: '');
    $config['search_api.server.solr']['name'] = 'Lagoon Solr - Environment: ' . getenv('LAGOON_PROJECT');
  }
  
// Redis configuration.
if (getenv('LAGOON')) {
$redis = new \Redis();
$redis_host = getenv('REDIS_HOST') ?: 'redis';
$redis_port = getenv('REDIS_SERVICE_PORT') ?: 6379;
try {
    # Do not use the cache during installations of Drupal.
    if (InstallerKernel::installationAttempted()) {
    throw new \Exception('Drupal installation underway.');
    }

    # Use a timeout to ensure that if the Redis pod is down, that Drupal will
    # continue to function.
    if ($redis->connect($redis_host, $redis_port, 1) === FALSE) {
    throw new \Exception('Redis server unreachable.');
    }

    $response = $redis->ping();
    if (strpos($response, 'PONG') === FALSE) {
    throw new \Exception('Redis could be reached but is not responding correctly.');
    }

    $settings['redis.connection']['interface'] = 'PhpRedis';
    $settings['redis.connection']['host'] = $redis_host;
    $settings['redis.connection']['port'] = $redis_port;
    $settings['cache_prefix']['default'] = getenv('REDIS_CACHE_PREFIX') ?: getenv('LAGOON_PROJECT') . '_' . getenv('LAGOON_GIT_SAFE_BRANCH');

    $settings['cache']['default'] = 'cache.backend.redis';

    // Include the default example.services.yml from the module, which will
    // replace all supported backend services (that currently includes the cache tags
    // checksum service and the lock backends, check the file for the current list).
    $settings['container_yamls'][] = 'modules/contrib/redis/example.services.yml';

    // Allow the services to work before the Redis module itself is enabled.
    $settings['container_yamls'][] = 'modules/contrib/redis/redis.services.yml';

    // Manually add the classloader path, this is required for the container cache bin definition below
    // and allows to use it without the redis module being enabled.
    $class_loader->addPsr4('Drupal\\redis\\', 'modules/contrib/redis/src');

    // Use redis for container cache.
    // The container cache is used to load the container definition itself, and
    // thus any configuration stored in the container itself is not available
    // yet. These lines force the container cache to use Redis rather than the
    // default SQL cache.
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
    catch (\Exception $error) {
    $settings['container_yamls'][] = 'sites/default/redis-unavailable.services.yml';
    $settings['cache']['default'] = 'cache.backend.null';
    }
}