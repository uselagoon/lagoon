<?php
/**
 * @file
 * amazee.io drushrc.php file
 *
 * This file tells drush about the amazee.io environment
 * It contains some defaults that the amazee.io team suggests, please edit them as required.
 */

### Base URL so Drush knows on which URL the site runs (needed for cron, etc.)
if (getenv('AMAZEEIO_BASE_URL')) {
  $options['uri'] = getenv('AMAZEEIO_BASE_URL');
}

### Skip data for some tables during sql dumps and syncs
# These tables will be syncronized just as structure and not the data inside them, this makes syncing and dumping much faster
# In case you need these tables, call the 'sql-sync' or 'sql-dump' command with: --no-structure-tables-list
$command_specific['sql-sync'] = array('structure-tables-list' => 'cache,cache_*,history,sessions,watchdog,feeds_log');
$command_specific['sql-dump'] = array('structure-tables-list' => 'cache,cache_*,history,sessions,watchdog,feeds_log');
