# Healthcheck

In this directory you'll find two files

- healthz.locations.php.disable
- healthz.locations

Both are designed to expose a `/.lagoonhealthz` location from the nginx service. The difference being that the `.php.disable` file is used to point to the [healthz-php](https://github.com/amazeeio/healthz-php) application _if_ there is a PHP service attached to this application.

The logic for which of the two files are enabled are contained in this image's `docker-entrypoint` file - there we check for the existence of the env var `NGINX_FASTCGI_PASS`, which indicates (or should indicate) the presence of a PHP-fpm service.