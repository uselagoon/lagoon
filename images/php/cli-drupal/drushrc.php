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

### Because of high security at OpenShift we need to change the behavior of rsync:
# omit-dir-times    we are interested in times for files, but not really for dirs, also it causes issues as rsync wants to chnage times of the main folder which is not possible on openshift
# no-perms          permissions are special on OpenShift (group writeable for root), but completely different locally (writeabble by root, etc)
# no-group          like no-perms, they are super special on OpenShift
# no-owner          anyway only interesting when syncing from remote to local (as this can be only used when executed as root), but prevents that it assigns local data with the random userids from openshift
# chmod=ugo=rwX     keep existing permissions (basically reproducing the umask 002 functionality)
$command_specific['rsync'] = array('omit-dir-times' => TRUE, 'no-perms' => TRUE, 'no-group' => TRUE, 'no-owner' => TRUE, 'chmod' => 'ugo=rwX');