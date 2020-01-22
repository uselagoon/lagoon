# php-cli-drupal

[Lagoon `php-cli-drupal` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/php/cli-drupal/Dockerfile) optimized to work with Drupal, based on [Lagoon `php-cli` image](https://github.com/AlannaBurke/lagoon/tree/3099c4aeaf2a67cc1e084cb7b8b01ef0fbf90bed/docs/docker-images/php-cli/php-cli.md), has all the command line tools needed for daily maintenance of a Drupal website:

* `drush`
* `drupal console`
* `drush launcher` \(which will fallback to Drush 8 if there is no site installed

  Drush found\)

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions)so this image will work with a random user, and therefore also on OpenShift.

