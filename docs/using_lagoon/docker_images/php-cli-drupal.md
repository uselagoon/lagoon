# php-cli-drupal Image

Based on Lagoon `php-cli` image, `cli-drupal` image has all tools for daily maintenance, plus `drush`.

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.

## Environment Variables

Environment variables are meant to do common behavior changes of php.

| Environment Variable              | Default   | Description                                                                                                                                                                                                              |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DRUSH_VERSION`                  | `8.3.0`   | Specify the Drush version to install
| `DRUSH_LAUNCHER_VERSION`         | `0.6.0`   | Specify the Drush Launcher version
| `DRUPAL_CONSOLE_LAUNCHER_VERSION`| `1.9.1`   | Specify the Drupal Console Launcher Version
| `DRUPAL_CONSOLE_LAUNCHER_VERSION_SHA`| `c44be5772de751a498374b43290c693e6a8c79f4`   | Specify the Drupal Console Launcher Version SHA checksum