# nginx-drupal Image
Lagoon `nginx-drupal` Docker image optimized to work with Drupal, based on Lagoon `nginx` image.

## Lagoon & OpenShift adaptions
This image is prepared to be used on Lagoon which leverages OpenShift.  
There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- For all file's section, there are two `include` directives: the `prepend*.conf` and the `append*.conf`. They allow to add and append custom configuration to `drupal.conf` file

## Included Nginx Drupal configuration (drupal.conf)

The image includes a full Drupal 7 and 8 Nginx working configuration. It includes some extra functionalities like:

 - support for `humanstxt` drupal module
 - support for `robotstxt` drupal module
 - disallow access to `vagrant` directory for local development