<?php

/**
 * @file
 * Lagoon Drupal 7 configuration file.
 *
 * You should not edit this file, please use environment specific files!
 * They are loaded in this order:
 * - settings.all.php
 *   For settings that should be applied to all environments (dev, prod, staging, docker, etc).
 * - settings.production.php
 *   For settings only for the production environment.
 * - settings.development.php
 *   For settings only for the development environment (dev servers, docker).
 * - settings.local.php
 *   For settings only for the local environment, this file will not be committed in GIT!
 */

 // Lagoon Database connection.
 if (getenv('LAGOON')) {
  $databases['default']['default'] = array(
    'driver' => 'mysql',
    'database' => getenv('MARIADB_DATABASE') ?: 'drupal',
    'username' => getenv('MARIADB_USERNAME') ?: 'drupal',
    'password' => getenv('MARIADB_PASSWORD') ?: 'drupal',
    'host' => getenv('MARIADB_HOST') ?: 'mariadb',
    'port' => 3306,
    'prefix' => '',
  );
}

  // Lagoon Solr connection
  // WARNING: you have to create a search_api server having "solr" machine name at
  // /admin/config/search/search-api/add-server to make this work.
  // Also you need to have the search_api_override module installed and enabled - https://www.drupal.org/project/search_api_override
  if (getenv('LAGOON')) {
    // Override search API server settings fetched from default configuration.
    $conf['search_api_override_mode'] = 'load';
    $conf['search_api_override_servers']['solr']['name'] = 'Lagoon Solr - Environment:' . getenv('LAGOON_PROJECT');
    $conf['search_api_override_servers']['solr']['options']['host'] = (getenv('SOLR_HOST') ?: 'solr');
    $conf['search_api_override_servers']['solr']['options']['port'] = 8983;
    $conf['search_api_override_servers']['solr']['options']['path'] = '/solr/' . (getenv('SOLR_CORE') ?: 'drupal');
    $conf['search_api_override_servers']['solr']['options']['http_user'] = (getenv('SOLR_USER') ?: '');
    $conf['search_api_override_servers']['solr']['options']['http_pass'] = (getenv('SOLR_PASSWORD') ?: '');
    $conf['search_api_override_servers']['solr']['options']['excerpt'] = 0;
    $conf['search_api_override_servers']['solr']['options']['retrieve_data'] = 0;
    $conf['search_api_override_servers']['solr']['options']['highlight_data'] = 0;
    $conf['search_api_override_servers']['solr']['options']['http_method'] = 'POST';
  }

  // Lagoon Varnish & reverse proxy settings.
  if (getenv('LAGOON')) {
    $varnish_control_port = getenv('VARNISH_CONTROL_PORT') ?: '6082';
    $varnish_hosts = explode(',', getenv('VARNISH_HOSTS') ?: 'varnish');
    array_walk($varnish_hosts, function (&$value, $key) use ($varnish_control_port) {
      $value .= ":$varnish_control_port";
    });

    $conf['reverse_proxy'] = TRUE;
    $conf['reverse_proxy_addresses'] = array_merge(explode(',', getenv('VARNISH_HOSTS')), array('varnish'));
    $conf['varnish_control_terminal'] = implode(" ", $varnish_hosts);
    $conf['varnish_control_key'] = getenv('VARNISH_SECRET') ?: 'lagoon_default_secret';
    $conf['varnish_version'] = 4;
  }

  // Base URL.
  if (getenv('LAGOON_ROUTE')) {
    $proto = isset($_SERVER["HTTP_X_FORWARDED_PROTO"]) ? $_SERVER["HTTP_X_FORWARDED_PROTO"] : 'http';
    $base_url = $proto . "://" . $_SERVER["HTTP_HOST"];
  }

  // Temp directory.
  if (getenv('TMP')) {
    $conf['file_temporary_path'] = getenv('TMP');
  }

  // Hash Salt.
  if (getenv('LAGOON')) {
    $drupal_hash_salt = hash('sha256', getenv('LAGOON_PROJECT'));
  }

  // Loading settings for all environment types.
  if (file_exists(__DIR__ . '/all.settings.php')) {
    include __DIR__ . '/all.settings.php';
  }

  // Environment specific settings files.
  if (getenv('LAGOON_ENVIRONMENT_TYPE')) {
    if (file_exists(__DIR__ . '/' . getenv('LAGOON_ENVIRONMENT_TYPE') . '.settings.php')) {
      include __DIR__ . '/' . getenv('LAGOON_ENVIRONMENT_TYPE') . '.settings.php';
    }
  }

  // Last: this servers specific settings files.
  if (file_exists(__DIR__ . '/settings.local.php')) {
    include __DIR__ . '/settings.local.php';
  }
