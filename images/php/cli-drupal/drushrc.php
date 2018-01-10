<?php
/**
 * @file
 * Lagoon global drushrc.php file
 *
 * This file tells drush about the lagoon environment
 */

### Drush Root
$options['root'] = '/app/' . getenv('WEBROOT');

### Base URL so Drush knows on which URL the site runs (needed for cron, etc.)
if (getenv('LAGOON_ROUTE')) {
  $options['uri'] = str_replace(['https://', 'http://'], ['', ''], getenv('LAGOON_ROUTE'));
}
