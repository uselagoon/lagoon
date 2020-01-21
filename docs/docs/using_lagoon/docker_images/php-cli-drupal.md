# php-cli-drupal Image

Based on Lagoon `php-cli` image, `cli-drupal` image has all tools for daily maintenance of a Drupal website:

* `drush`
* `drupal console`
* `drush launcher` \(which will fallback to drush 8 if there is no site installed drush found\)

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.

