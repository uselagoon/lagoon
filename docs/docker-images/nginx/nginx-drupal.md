# nginxdrupal

[Lagoon `nginx-drupal` Docker image](https://github.com/amazeeio/lagoon/blob/master/images/nginx-drupal/Dockerfile) optimized to work with Drupal, based on [Lagoon `nginx` image](nginx.md).

## Lagoon & OpenShift adaptions

This image is prepared to be used on Lagoon which leverages OpenShift. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions)so this image will work with a random user, and therefore also on OpenShift.
* To keep `drupal.conf` configuration's file as clean and customizable as possible, we added `include` directives in the main sections of the file:`server`, `location /`, `location @drupal` and `location @php`.
* Further information in the section [Drupal.conf customization](nginx-drupal.md#drupal-conf-customization).

## Included Nginx Drupal configuration \(drupal.conf\)

The image includes a full Drupal 7 and 8 Nginx working configuration. It includes some extra functionalities like:

* support for [`humanstxt` Drupal module](https://www.drupal.org/project/humanstxt).
* support for [`robotstxt` Drupal module](https://www.drupal.org/project/robotstxt).
* disallow access to `vagrant` directory for local development

## Drupal.conf customization

The `drupal.conf` file is a customized version of `nginx` configuration file, optimized for `Drupal`. Customers have different ways of customizing it:

* _modifying it_ \(hard to support in case of errors\)
* using _built-in_ customization through `*.conf` files.

The `drupal.conf` file is divided into several sections. The sections we've included in our _customizations_ are:

* `server`
* `location /`
* `location @drupal`
* `location @php`.

For each of this section, there are **two** includes:

* `*_prepend.conf`
* `*_append.conf`

Here what the `location @drupal` section looks like:

```bash
location @drupal {
    include /etc/nginx/conf.d/drupal/location_drupal_prepend*.conf;

    include        /etc/nginx/fastcgi.conf;
    fastcgi_param  SCRIPT_NAME        /index.php;
    fastcgi_param  SCRIPT_FILENAME    $realpath_root/index.php;
    fastcgi_pass   ${NGINX_FASTCGI_PASS:-php}:9000;

    include /etc/nginx/conf.d/drupal/location_drupal_append*.conf;
}
```

This configuration allows customers to create files called `location_drupal_prepend.conf` and `location_drupal_append.conf`, where they can put all the configurations they want to insert before and after the other statements.

Those files, once created, **MUST** exist in the `nginx` container, so add them to `Dockerfile.nginx` like so:

```bash
COPY location_drupal_prepend.conf /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
```

