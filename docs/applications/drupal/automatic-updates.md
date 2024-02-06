# Automatic Updates

Lagoon deploys applications in a way that is not compatible with some methods of
updating Drupal core and contrib. Lagoon expects to build immutable images and
run immutable containers. When the code of the application is changed at
runtime, it can cause any of the following problems:

1. Containers are managed automatically by Kubernetes and may be moved,
   restarted, or scaled at any time. When this happens, the original built
   container image will be ran and any changes that happened at runtime are
   lost.
2. Tasks and cronjobs may run with the orignal built container image and won't
   have access to any updated code.
3. Updating requires write permissions to the filesystem, but it is possible to
   configure an environment that forces a read-only filesystem.
4. Best practices is to deploy small containers that each do one thing. For a
   typical Drupal project this means there is a `cli`, `php`, and `nginx`
   container which each contain a copy of the code. Updating only one of these
   containers will cause issues with code mismatches.

The following update methods been disabled by Lagoon.

## Drupal Automatic Updates

The [Automatic Updates](https://www.drupal.org/project/automatic_updates)
contrib module is disabled by and it will also be disabled when it moves
into Drupal core.

## Drush

Using `drush pm-install` or `drush pm-update` is disabled by default as part of
the [amazeeio/drupal-integrations](https://github.com/amazeeio/drupal-integrations)
package.
