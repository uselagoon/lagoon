<?php

/**
 * @file
 * Lagoon Drupal 7 development environment configuration file.
 *
 * This file will only be included on development environments.
 * It contains some defaults that the Lagoon team suggests, please edit them as required.
 */

// Show all error messages on the site.
$conf['error_level'] = 2;

// Anonymous caching disabled.
$conf['cache'] = 0;

// Block caching disabled.
$conf['block_cache'] = 0;

// Expiration of cached pages to 0.
$conf['page_cache_maximum_age'] = 0;

// Aggregate and compress CSS files off.
$conf['preprocess_css'] = 0;

// Aggregate JavaScript files off.
$conf['preprocess_js'] = 0;

// Stage file proxy URL from production URL.
if (getenv('LAGOON_PRODUCTION_URL')) {
  $conf['stage_file_proxy_origin'] = getenv('LAGOON_PRODUCTION_URL');
}
