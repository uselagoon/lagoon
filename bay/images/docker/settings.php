<?php

/**
 * @file
 * Bay Drupal 8 configuration file.
 */

$bay_settings_path = __DIR__;
$settings_path = $app_root . DIRECTORY_SEPARATOR . 'sites/default';
$contrib_path = $app_root . DIRECTORY_SEPARATOR . (is_dir('modules/contrib') ? 'modules/contrib' : 'modules');

// Database connection.
$databases['default']['default'] = [
  'driver' => 'mysql',
  'database' => getenv('MARIADB_DATABASE') ?: 'drupal',
  'username' => getenv('MARIADB_USERNAME') ?: 'drupal',
  'password' => getenv('MARIADB_PASSWORD') ?: 'drupal',
  'host' => getenv('MARIADB_HOST') ?: 'mariadb',
  'port' => 3306,
  'prefix' => '',
];

// Varnish & Reverse proxy settings.
$settings['reverse_proxy'] = TRUE;

$settings['update_free_access'] = FALSE;

// Defines where the sync folder of your configuration lives. In this case it's
// inside the Drupal root, which is protected by lagoon nginx configs,
// so it cannot be read via the browser. If your Drupal root is inside a
// subfolder (like 'web') you can put the config folder outside this subfolder
// for an advanced security measure: '../config/sync'.
$config_directories[CONFIG_SYNC_DIRECTORY] = '../config/sync';

// The default list of directories that will be ignored by Drupal's file API.
$settings['file_scan_ignore_directories'] = [
  'node_modules',
];

// The default number of entities to update in a batch process.
$settings['entity_update_batch_size'] = 50;

// Environment indicator settings.
$config['environment_indicator.indicator']['name'] = $config['environment'];
$config['environment_indicator.indicator']['bg_color'] = !empty($config['environment_indicator.indicator']['bg_color']) ? $config['environment_indicator.indicator']['bg_color'] : 'green';

// Disable local split.
$config['config_split.config_split.local']['status'] = FALSE;

// Redis.
if (!drupal_installation_attempted()) {
  $settings['redis.connection']['host'] = 'redis';
  $settings['redis.connection']['port'] = '6379';
  $settings['redis.connection']['password'] = '';
  $settings['redis.connection']['base'] = 0;
  $settings['redis.connection']['interface'] = 'PhpRedis';
  $settings['cache']['default'] = 'cache.backend.redis';
  $settings['cache']['bins']['bootstrap'] = 'cache.backend.chainedfast';
  $settings['cache']['bins']['discovery'] = 'cache.backend.chainedfast';
  $settings['cache']['bins']['config'] = 'cache.backend.chainedfast';
  $settings['container_yamls'][] = $contrib_path . '/redis/example.services.yml';
}

// Expiration of cached pages on Varnish to 15 min
$config['system.performance']['cache']['page']['max_age'] = 900;

// Aggregate CSS files on
$config['system.performance']['css']['preprocess'] = 1;

// Aggregate JavaScript files on
$config['system.performance']['js']['preprocess'] = 1;

/**
 * Fast 404 settings.
 *
 * Fast 404 will do two separate types of 404 checking.
 *
 * The first is to check for URLs which appear to be files or images. If Drupal
 * is handling these items, then they were not found in the file system and are
 * a 404.
 *
 * The second is to check whether or not the URL exists in Drupal by checking
 * with the menu router, aliases and redirects. If the page does not exist, we
 * will server a fast 404 error and exit.
 */
// Disallowed extensions. Any extension in here will not be served by Drupal and
// will get a fast 404. This will not affect actual files on the filesystem as
// requests hit them before defaulting to a Drupal request.
// Default extension list, this is considered safe and is even in queue for
// Drupal 8 (see: http://drupal.org/node/76824).
$settings['fast404_exts'] = '/^(?!robots).*\.(txt|png|gif|jpe?g|css|js|ico|swf|flv|cgi|bat|pl|dll|exe|asp)$/i';
// If you would prefer a stronger version of NO then return a 410 instead of a
// 404. This informs clients that not only is the resource currently not present
// but that it is not coming back and kindly do not ask again for it.
// Reference: http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
// $conf['fast_404_return_gone'] = TRUE;
// Allow anonymous users to hit URLs containing 'imagecache' even if the file
// does not exist. TRUE is default behavior. If you know all imagecache
// variations are already made set this to FALSE.
$settings['fast404_allow_anon_imagecache'] = TRUE;
// If you use FastCGI, uncomment this line to send the type of header it needs.
// Reference: http://php.net/manual/en/function.header.php
//$conf['fast_404_HTTP_status_method'] = 'FastCGI';
// BE CAREFUL with this setting as some modules
// use their own php files and you need to be certain they do not bootstrap
// Drupal. If they do, you will need to whitelist them too.
$conf['fast404_url_whitelisting'] = FALSE;
// Array of whitelisted files/urls. Used if whitelisting is set to TRUE.
$settings['fast404_whitelist'] = [
  'index.php',
  'rss.xml',
  'install.php',
  'cron.php',
  'update.php',
  'xmlrpc.php',
];
// Array of whitelisted URL fragment strings that conflict with fast404.
$settings['fast404_string_whitelisting'] = ['/advagg_'];
// Fast 404 error message.
$settings['fast404_html'] = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML+RDFa 1.0//EN" "http://www.w3.org/MarkUp/DTD/xhtml-rdfa-1.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><title>404 Not Found</title></head><body><h1>Not Found</h1><p>The requested URL "@path" was not found on this server.</p></body></html>';
// Load the fast404.inc file. This is needed if you wish to do extension
// checking in settings.php.
if (file_exists($contrib_path . '/fast404/fast404.inc')) {
  include_once $contrib_path . '/fast404/fast404.inc';
  fast404_preboot($settings);
}

// Temp directory.
if (getenv('TMP')) {
  $config['system.file']['path']['temporary'] = getenv('TMP');
}

// Hash Salt.
$settings['hash_salt'] = hash('sha256', getenv('LAGOON_PROJECT'));

////////////////////////////////////////////////////////////////////////////////
//////////////////////// PER-ENVIRONMENT SETTINGS //////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Include Bay services.
if (file_exists($bay_settings_path . '/services.yml')) {
  $settings['container_yamls'][] = $bay_settings_path . '/services.yml';
}

// Include environment specific settings and services files.
if (getenv('LAGOON_ENVIRONMENT_TYPE')) {
  if (file_exists($settings_path . '/envs/' . getenv('LAGOON_ENVIRONMENT_TYPE') . '/settings.php')) {
    include $settings_path . '/envs/' . getenv('LAGOON_ENVIRONMENT_TYPE') . '/settings.php';
  }
  if (file_exists($settings_path . '/envs/' . getenv('LAGOON_ENVIRONMENT_TYPE') . '/services.yml')) {
    $settings['container_yamls'][] = $settings_path . '/envs/' . getenv('LAGOON_ENVIRONMENT_TYPE') . '/services.yml';
  }
}
