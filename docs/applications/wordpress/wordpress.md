# Wordpress on Lagoon

The [Wordpress template](https://www.github.com/lagoon-examples/wordpress-base) is configured to use Composer to install Wordpress, it's dependencies and themes.

THe wordpress template is based on the https://github.com/roots/bedrock boilerplate, but extended to match a standardised Lagoon deployment pattern.

## Composer Install

The template uses composer to install wordpress and it's themes.

## Database

Lagoon can support MariaDB and PostgreSQL databases, but as support for PostgreSQL is limited in WordPress it isn't recommended for use.

## NGINX configuration

Lagoon doesn't have a built-in configuration for WordPress - instead, the template comes with a [starting nginx.conf](https://github.com/lagoon-examples/wordpress-base/tree/main/lagoon/nginx) - please contribute any improvements you may find

## WP-CLI

The Lagoon template installs wp-cli into the cli image to manage your wordpress install.
