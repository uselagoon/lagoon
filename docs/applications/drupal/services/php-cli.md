# PHP-CLI-Drupal

The [Lagoon `php-cli-drupal` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal) is optimized to work with Drupal. It is based on the [Lagoon `php-cli` image](../../../docker-images/php-cli.md), and has all the command line tools needed for the daily maintenance of a Drupal website:

* `drush`
* `drupal console`
* `drush launcher` \(which will fallback to Drush 8 if there is no site installed Drush found\)

## Supported versions

* 7.3 \(available for compatibility only, no longer officially supported\)
* 7.4 \(available for compatibility only, no longer officially supported\) - `uselagoon/php-7.4-cli-drupal`
* 8.0 \(available for compatibility only, no longer officially supported\) - `uselagoon/php-8.0-cli-drupal`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.1.Dockerfile) - `uselagoon/php-8.1-cli-drupal`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.2.Dockerfile) - `uselagoon/php-8.2-cli-drupal`
* 8.3 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.3.Dockerfile) - `uselagoon/php-8.3-cli-drupal`

All PHP versions use their own Dockerfiles.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
