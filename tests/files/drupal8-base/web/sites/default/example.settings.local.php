<?php
/**
 * @file
 * amazee.io Drupal 8 example settings.local.php file
 *
 * This file will not be included and is just an example file.
 * If you would like to use this file, copy it to the name 'settings.local.php' (this file will be exluded from Git)
 */

// Disable render caches, necessary for twig files to be reloaded on every page view
$settings['cache']['bins']['render'] = 'cache.backend.null';
$settings['cache']['bins']['dynamic_page_cache'] = 'cache.backend.null';
