# php-cli-drupal

[Lagoon `php-cli-drupal` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/php/cli-drupal/Dockerfile) optimized to work with Drupal, based on [Lagoon `php-cli` image](php-cli.md), has all the command line tools needed for daily maintenance of a Drupal website:

* `drush`
* `drupal console`
* `drush launcher` \(which will fallback to Drush 8 if there is no site installed

  Drush found\)

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions)so this image will work with a random user, and therefore also on OpenShift.

