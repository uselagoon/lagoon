# nginx-drupal Image

Lagoon `nginx-drupal` Docker image optimized to work with Drupal, based on Lagoon `nginx` image.

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift.  
There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
* To keep `drupal.conf` configuration's file as clean and customizable as possible, we added `include` directives in the main sections of the file: `server`, `location /`, `location @drupal` and `location @php`. Further information in the section [Drupal.conf customization](nginx-drupal.md#drupalconf-customization).

## Included Nginx Drupal configuration \(drupal.conf\)

The image includes a full Drupal 7 and 8 Nginx working configuration. It includes some extra functionalities like:

* support for `humanstxt` drupal module
* support for `robotstxt` drupal module
* disallow access to `vagrant` directory for local development

## Drupal.conf customization

The `drupal.conf` file is a customized version of `nginx` configuration file, optimized for `Drupal`.  
Customers has different ways to customize it: _modifying it_ \(hard to support in case of errors\) or using _built-in_ customization through `*.conf` files.

The `drupal.conf` file, is divided in several sections. The one we included our _customizations_ are: `server`, `location /`, `location @drupal` and `location @php`.  
For each of this section, there are **two** includes:

* `*_prepend.conf`
* `*_append.conf`

Here how the `location @drupal` section is:

```text
location @drupal {
    include /etc/nginx/conf.d/drupal/location_drupal_prepend*.conf;

    include        /etc/nginx/fastcgi.conf;
    fastcgi_param  SCRIPT_NAME        /index.php;
    fastcgi_param  SCRIPT_FILENAME    $realpath_root/index.php;
    fastcgi_pass   ${NGINX_FASTCGI_PASS:-php}:9000;

    include /etc/nginx/conf.d/drupal/location_drupal_append*.conf;
}
```

This configuration allows customers to create files called `location_drupal_prepend.conf` and `location_drupal_append.conf`, where put all the configurations they want to insert before and after the other statements.  
Those files, once created **MUST**, exist into the `nginx` container, so add in the `Dockerfile.nginx`, rows like:

```text
COPY location_drupal_prepend.conf /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
```

