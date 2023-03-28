# NGINX-Drupal

The [Lagoon `nginx-drupal` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx-drupal/Dockerfile). Optimized to work with Drupal. Based on [Lagoon `nginx` image](../../docker-images/nginx.md).

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* To keep `drupal.conf` 's configuration file as clean and customizable as possible, we added `include` directives in the main sections of the file:`server`, `location /`, `location @drupal` and `location @php`.
* Further information in the section [`Drupal.conf` customization](nginx.md#drupal-conf-customization).

## Included Drupal configuration \(`drupal.conf`\)

The image includes a full NGINX working configuration for Drupal 7, 8 and 9. It includes some extra functionalities like:

* Support for [`humanstxt` Drupal module](https://www.drupal.org/project/humanstxt).
* Support for [`robotstxt` Drupal module](https://www.drupal.org/project/robotstxt).
* Disallow access to `vagrant` directory for local development.

## `Drupal.conf` customization

The `drupal.conf` file is a customized version of the `nginx` configuration file, optimized for Drupal. Customers have different ways of customizing it:

* _Modifying it_ \(hard to support in case of errors\).
* Using _built-in_ customization through `*.conf` files.

The `drupal.conf` file is divided into several sections. The sections we've included in our customizations are:

* `server`
* `location /`
* `location @drupal`
* `location @php`.

For each of this section, there are **two** includes:

* `*_prepend.conf`
* `*_append.conf`

Here what the `location @drupal` section looks like:

```bash title="drupal.conf"
location @drupal {
    include /etc/nginx/conf.d/drupal/location_drupal_prepend*.conf;

    include        /etc/nginx/fastcgi.conf;
    fastcgi_param  SCRIPT_NAME        /index.php;
    fastcgi_param  SCRIPT_FILENAME    $realpath_root/index.php;
    fastcgi_pass   ${NGINX_FASTCGI_PASS:-php}:9000;

    include /etc/nginx/conf.d/drupal/location_drupal_append*.conf;
}
```

This configuration allows customers to create files called `location_drupal_prepend.conf` and `location_drupal_append.conf`, where they can put all the configuration they want to insert before and after the other statements.

Those files, once created, **MUST** exist in the `nginx` container, so add them to `Dockerfile.nginx` like so:

```bash title="dockerfile.nginx"
COPY location_drupal_prepend.conf /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
```

## Drupal Core Statistics Module Configuration

If you're using the core Statistics module, you may run into an issue that needs a quick configuration change.

With the default NGINX configuration, the request to the tracking endpoint `/core/modules/statistics/statistics.php` is denied \(404\).

This is related to the default Nginx configuration:

```text title="drupal.conf"
location ~* ^.+\.php$ {
    try_files /dev/null @drupal;
}
```

To fix the issue, we instead define a specific location rule and inject this as a location prepend configuration:

```text title="drupal.conf"
## Allow access to to the statistics endpoint.
location ~* ^(/core/modules/statistics/statistics.php) {
      try_files /dev/null @php;
}
```

And copy this during the NGINX container build:

```text title="dockerfile.nginx"
# Add specific Drupal statistics module NGINX configuration.
COPY .lagoon/nginx/location_prepend_allow_statistics.conf /etc/nginx/conf.d/drupal/location_prepend_allow_statistics.conf
```
