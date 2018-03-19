<?php
/**
 * @file
 * amazee.io Drupal 8 all environment configuration file.
 *
 * This file should contain all settings.php configurations that are needed by all environments.
 *
 * It contains some defaults that the amazee.io team suggests, please edit them as required.
 */

// Defines where the sync folder of your configuration lives. In this case it's inside
// the Drupal root, which is protected by amazee.io nginx configs, so it cannot be read
// via the browser. If your Drupal root is inside a subfolder (like 'web') you can put the config
// folder outside this subfolder for an advanced security measure: '../config/sync'.
$config_directories[CONFIG_SYNC_DIRECTORY] = '../config/sync';
