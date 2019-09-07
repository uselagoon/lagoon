# php-fpm Image

amazee.io Alpine 7 Dockerfile with php-fpm installed, based on the official PHP Alpine images at (https://hub.docker.com/_/php/)

This Dockerfile is intended to be used as an base for any php needs within amazee.io. This image itself does not create a webserver, rather just an php-fpm fastcgi listener. You maybe need to adapt the php-fpm pool config.

## amazee.io & OpenShift adaptions

This image is prepared to be used on amazee.io which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- The `/usr/local/etc/php/php.ini` and `/usr/local/etc/php-fpm.conf` plus all files within `/usr/local/etc/php-fpm.d/` are parsed through [envplate](https://github.com/kreuzwerker/envplate) with an container-entrypoint.
- See the [Dockerfile](https://github.com/amazeeio/lagoon/blob/master/images/php/fpm/Dockerfile) for installed php extensions
- To install further extensions, extend your Dockerfile from this image, and install extensions according to the docs, under the heading ["How to install more PHP extensions"](https://github.com/docker-library/docs/blob/master/php/README.md#how-to-install-more-php-extensions)

## Included php config

The included php config contains sane values that will make the creation of php pools configs easier. Here a list these, check `/usr/local/etc/php.ini`, `/usr/local/etc/php-fpm.conf` for all of it:

- `max_execution_time = 900` (changeable via `PHP_MAX_EXECUTION_TIME`)
- `realpath_cache_size = 256k` for handling big php projects
- `memory_limit = 400M` for big php projects (changeable via `PHP_MEMORY_LIMIT`)
- `opcache.memory_consumption = 265` for big php projects
- `opcache.enable_file_override = 1` and `opcache.huge_code_pages = 1` for faster php
- `display_errors = Off` and `display_startup_errors = Off` for sane production values (changeable via `PHP_DISPLAY_ERRORS` and `PHP_DISPLAY_STARTUP_ERRORS`)
- `upload_max_filesize = 2048M` for big file uploads
- `apc.shm_size = 32m` and `apc.enabled = 1` (changeable via `PHP_APC_SHM_SIZE` and `PHP_APC_ENABLED`)
- php-fpm error logging happens in stderr

Hint: If you don't like any of these configs, you have three possibilities:
1. If they are changeable via environment variables, use them (preferred version, see list of environment variables below)
2. Create your own fpm-pool config and set configs them via `php_admin_value` and `php_admin_flag` in there (learn more about them [here](http://php.net/manual/en/configuration.changes.php) - yes this refers to Apache, but it is also the case for php-fpm). _Important:_
    1. If you like to provide your own php-fpm pool, overwrite the file `/usr/local/etc/php-fpm.d/www.conf` with your own config or remove this file if you like another name. If you don't do that the provided pool will be started!
    2. PHP Values with the [`PHP_INI_SYSTEM` changeable mode](http://php.net/manual/en/configuration.changes.modes.php) cannot be changed via an fpm-pool config. They need to changed either via already provided Environment variables or:
3. Provide your own `php.ini` or `php-fpm.conf` file (least preferred version)

## default fpm-pool

This image is shipped with an fpm-pool config ([`php-fpm.d/www.conf`](https://github.com/amazeeio/lagoon/blob/master/images/php/fpm/php-fpm.d/www.conf)) that creates a fpm-pool and listens on port 9000. This is because we try to provide an image which covers already most needs for PHP and so you don't need to create your own. You are happy to do so if you like though :) Here a short description of what this file does:

- listens on port 9000 via ipv4 and ipv6
- uses the pm `dynamic` and creates between 2-50 children
- respawns fpm pool children after 500 requests to prevent memory leaks
- replies with `pong` when making an fastcgi request to `/ping` (good for automated testing if the pool started)
- `catch_workers_output = yes` to see php errors
- `clear_env = no` to be able to inject PHP environment variables via regular Docker environment variables

## Environment Variables

Environment variables are meant to do common behavior changes of php.

| Environment Variable              | Default   | Description                                                                                                                                                                                                              |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `NEWRELIC_ENABLED`                | `false`   | Enable NewRelic performance monitoring, needs`NEWRELIC_LICENSE` be configured                                                                                                                                            |
| `NEWRELIC_LICENSE`                | (not set) | NewRelic License to be used, Important: `NEWRELIC_ENABLED` needs to be set to `true` in order for NewRelic to be enabled
| `PHP_APC_ENABLED`                 | `1`       | Can be set to 0 to disable APC, [see php.net](http://php.net/manual/en/apc.configuration.php#ini.apc.enabled)                                                                                                            |
| `PHP_APC_SHM_SIZE`                | `32m`     | The size of each shared memory segment given, [see php.net](http://php.net/manual/en/apc.configuration.php#ini.apc.shm-size)                                                                                             |
| `PHP_DISPLAY_ERRORS`              | `Off`     | This determines whether errors should be printed to the screen as part of the output or if they should be hidden from the user, [see php.net](http://php.net/display-errors)                                             |
| `PHP_DISPLAY_STARTUP_ERRORS`      | `Off`     | Even when display_errors is on, errors that occur during PHP's startup sequence are not displayed. It's strongly recommended to keep it off, except for debugging., [see php.net](http://php.net/display-startup-errors) |
| `PHP_ERROR_REPORTING`             | Production: `E_ALL & ~E_DEPRECATED & ~E_STRICT`<br> Development: `E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE` | The desired logging level you'd like PHP to use. [see php.net](https://www.php.net/manual/en/function.error-reporting.php)                                                                                                |
| `PHP_FPM_PM_MAX_CHILDREN`         | `50`      | The the maximum number of child processes [see php.net](http://php.net/manual/en/install.fpm.configuration.php)                                                                                                          |
| `PHP_FPM_PM_MAX_REQUESTS`         | `500`     | The number of requests each child process should execute before respawning. [see php.net](http://php.net/manual/en/install.fpm.configuration.php)                                                                        |                                                                                                 |
| `PHP_FPM_PM_MAX_SPARE_SERVERS`    | `2`       | The desired maximum number of idle server processes. [see php.net](http://php.net/manual/en/install.fpm.configuration.php)                                                                                               |
| `PHP_FPM_PM_MIN_SPARE_SERVERS`    | `2`       | The desired minimum number of idle server processes. [see php.net](http://php.net/manual/en/install.fpm.configuration.php)                                                                                               |
| `PHP_FPM_PM_PROCESS_IDLE_TIMEOUT` | `60s`     | The number of seconds after which an idle process will be killed. [see php.net](http://php.net/manual/en/install.fpm.configuration.php)                                                                                  |
| `PHP_FPM_PM_START_SERVERS`        | `2`       | The number of child processes created on startup. [see php.net](http://php.net/manual/en/install.fpm.configuration.php)                                                                                                  |
| `PHP_MAX_EXECUTION_TIME`          | `900`     | Maximum execution time of each script, in seconds,  [see php.net](http://php.net/max-execution-time)                                                                                                                     |
| `PHP_MAX_FILE_UPLOADS`            | `20`    | The maximum number of files allowed to be uploaded simultaneously, [see php.net](http://php.net/manual/en/ini.core.php#ini.max-file-uploads)|
| `PHP_MAX_INPUT_VARS`              | `2000`    | How many input variables will be accepted, [see php.net](http://php.net/manual/en/info.configuration.php#ini.max-input-vars)
| `PHP_MEMORY_LIMIT`                | `400M`    | Maximum amount of memory a script may consume,   [see php.net](http://php.net/memory-limit)                                                                                                                              |
| `XDEBUG_ENABLED`                  | (not set) | Used to enable xdebug extension, [see php.net](http://php.net/manual/en/apc.configuration.php#ini.apc.enabled)                                                                                                           |
