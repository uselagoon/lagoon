<?php

/**
 * @file
 * Lagoon Drupal settings file.
 *
 * The primary settings file for Drupal which includes
 * settings.lagoon.php that contains Lagoon-specific settings.
 */

/**
 * Load services definition file.
 */
$settings['container_yamls'][] = __DIR__ . '/services.yml';

/**
 * Include the Lagoon-specific settings file.
 *
 * N.B. The settings.lagoon.php file makes some changes
 *      that affect all environments that this site
 *      exists in.  Always include this file, even in
 *      a local development environment, to ensure that
 *      the site settings remain consistent.
 */
include __DIR__ . "/settings.lagoon.php";

/**
 * Skipping permissions hardening.
 *
 * Enabling this will make scaffolding work better
 * but will also raise a warning when you install Drupal.
 * See https://www.drupal.org/project/drupal/issues/3091285.
 *
 * @code
 *  $settings['skip_permissions_hardening'] = TRUE;
 * @endcode
 */

// Last: this servers specific settings files.
if (file_exists(__DIR__ . '/settings.local.php')) {
  include __DIR__ . '/settings.local.php';
}

// Last: This server specific services file.
if (file_exists(__DIR__ . '/services.local.yml')) {
  $settings['container_yamls'][] = __DIR__ . '/services.local.yml';
}
