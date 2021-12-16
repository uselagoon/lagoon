# PHP-CLI-Drupal

The [Lagoon `php-cli-drupal` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal) is optimized to work with Drupal. It is based on the [Lagoon `php-cli` image](./), and has all the command line tools needed for the daily maintenance of a Drupal website:

* `drush`
* `drupal console`
* `drush launcher` \(which will fallback to Drush 8 if there is no site installed Drush found\)

## Supported versions

* 5.6 \(available for compatibility, no longer officially supported\)
* 7.0 \(available for compatibility, no longer officially supported\)
* 7.2 \(available for compatibility, no longer officially supported\)
* 7.3 \(available for compatibility, no longer officially supported\)
* 7.4 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/7.4.Dockerfile) - `uselagoon/php-7.4-cli-drupal`
* 8.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.0.Dockerfile) - `uselagoon/php-8.0-cli-drupal`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.1.Dockerfile) - `uselagoon/php-8.1-cli-drupal`

All PHP versions use their own Dockerfiles.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions), so this image will work with a random user.
