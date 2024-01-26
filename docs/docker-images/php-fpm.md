# PHP-FPM

The [Lagoon `php-fpm` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm). Based on [the official PHP Alpine images](https://hub.docker.com/_/php/).

> _PHP-FPM \(FastCGI Process Manager\) is an alternative PHP FastCGI implementation with some additional features useful for sites of any size, especially busier sites._
>
> * from [https://php-fpm.org/](https://php-fpm.org/)
>
> FastCGI is a way of having server scripts execute time-consuming code just once instead of every time the script is loaded, reducing overhead.

!!! Info
    This Dockerfile is intended to be used as a base for any `PHP` needs within Lagoon. This image itself does not create a web server, rather a `php-fpm` fastcgi listener. You may need to adapt the `php-fpm` pool config.

## Supported versions

* 7.3 \(available for compatibility only, no longer officially supported\) - `uselagoon/php-7.3-fpm`
* 7.4 \(available for compatibility only, no longer officially supported\) - `uselagoon/php-7.4-fpm`
* 8.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.0.Dockerfile) (Security Support until November 2023) - `uselagoon/php-8.0-fpm`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.1.Dockerfile) (Security Support until November 2024) - `uselagoon/php-8.1-fpm`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.2.Dockerfile) (Security Support until December 2025) - `uselagoon/php-8.2-fpm`

All PHP versions use their own Dockerfiles.

!!! Tip
    We stop updating End of Life \(EOL\) PHP images usually with the Lagoon release that comes after the officially communicated EOL date: [https://www.php.net/supported-versions.php](https://www.php.net/supported-versions.php). Previous published versions will remain available.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things are already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* The `/usr/local/etc/php/php.ini` and `/usr/local/etc/php-fpm.conf`, plus all files within `/usr/local/etc/php-fpm.d/` , are parsed through [`envplate`](https://github.com/kreuzwerker/envplate) with a container-entrypoint.
* See the [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/8.0.Dockerfile) for installed `PHP` extensions.
* To install further extensions, extend your Dockerfile from this image. Install extensions according to the docs, under the heading [How to install more PHP extensions.](https://github.com/docker-library/docs/blob/master/php/README.md#how-to-install-more-php-extensions)

## Included PHP config

The included `PHP` config contains sensible values that will make the creation of `PHP` pools config easier. Here is a list of some of these. Check `/usr/local/etc/php.ini`, `/usr/local/etc/php-fpm.conf` for all of them:

| Value | Details |
| :--- | :--- |
| `max_execution_time = 900` | Changeable via `PHP_MAX_EXECUTION_TIME`. |
| `realpath_cache_size = 256k` | For handling big PHP projects. |
| `memory_limit = 400M` | For big PHP projects \(changeable via `PHP_MEMORY_LIMIT`\). |
| `opcache.memory_consumption = 265` | For big PHP projects. |
| `opcache.enable_file_override = 1` and `opcache.huge_code_pages = 1` | For faster PHP. |
| `display_errors = Off` and `display_startup_errors = Off` | For sensible production values \(changeable via `PHP_DISPLAY_ERRORS` and `PHP_DISPLAY_STARTUP_ERRORS`\). |
| `upload_max_filesize = 2048M` | For big file uploads. |
| `apc.shm_size = 32m` and `apc.enabled = 1` | Changeable via `PHP_APC_SHM_SIZE` and `PHP_APC_ENABLED`. |

Also, `php-fpm` error logging happens in `stderr`.

**💡 If you don't like any of these configs, you have three possibilities:**

1. If they are changeable via environment variables, use environment variables \(this is the preferred method, see [table of environment variables below](php-fpm.md#environment-variables)\).
2. Create your own `fpm-pool` config and set via `php_admin_value` and `php_admin_flag`.
   1. Learn more about them in [`this documentation for Running PHP as an Apache module`](https://www.php.net/manual/en/configuration.changes.php). This documentation refers to Apache, but it is also the case for `php-fpm`\).

      _Important:_

      1. If you want to provide your own `php-fpm` pool, overwrite the file `/usr/local/etc/php-fpm.d/www.conf` with your own config, or rename this file if you want it to have another name. If you don't do that, the provided pool will be started!
      2. PHP values with the [`PHP_INI_SYSTEM` changeable mode](https://www.php.net/manual/en/configuration.changes.modes.php) cannot be changed via an `fpm-pool` config. They need to be changed either via already provided environment variables or:
3. Provide your own `php.ini` or `php-fpm.conf` file \(this is the least preferred method\).

## Default fpm-pool

This image is shipped with an `fpm-pool` config \([`php-fpm.d/www.conf`](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/php-fpm.d/www.conf)\) that creates an `fpm-pool` and listens on port 9000. This is because we try to provide an image which already covers most needs for PHP, so you don't need to create your own. You are welcome to do so if you like, though!

Here a short description of what this file does:

* Listens on port 9000 via IPv4 and IPv6.
* Uses the pm `dynamic` and creates between 2-50 children.
* Re-spawns `php-fpm` pool children after 500 requests to prevent memory leaks.
* Replies with `pong` when making a fastcgi request to `/ping` \(good for automated testing to check if the pool started\).
* `catch_workers_output = yes` to see PHP errors.
* `clear_env = no` to be able to inject PHP environment variables via regular Docker environment variables.

## Environment Variables

Some options are configurable via [environment
variables](../using-lagoon-advanced/environment-variables.md).

| Environment Variable                 | Default   | Description                                                                                                                                              |
| :----------------------------------- | :-------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NEWRELIC_ENABLED                     | false     | Enable NewRelic performance monitoring, needs `NEWRELIC_LICENSE` be configured.                                                                          |
| NEWRELIC_LICENSE                     | (not set) | NewRelic license to be used. Important: `NEWRELIC_ENABLED` needs to be set to`true` in order for NewRelic to be enabled.                                 |
| NEWRELIC_BROWSER_MONITORING_ENABLED  | true      | This enables auto-insertion of the JavaScript fragments for NewRelic browser monitoring. Important: `NEWRELIC_ENABLED` needs to be set to`true` in order for NewRelic to be enabled. |
| NEWRELIC_DISTRIBUTED_TRACING_ENABLED | false     | This enables distributed tracing. Important: `NEWRELIC_ENABLED` needs to be set to`true` in order for NewRelic to be enabled.                            |
| PHP_APC_ENABLED                      | 1         | Can be set to `0` to disable [APC](https://www.php.net/manual/en/apcu.configuration.php).                                                                |
| PHP_APC_SHM_SIZE                     | 32m       | The size of each shared memory segment given.                                                                                                            |
| PHP_DISPLAY_ERRORS                   | Off       | Configures whether errors are printed or hidden. [See php.net](https://www.php.net/display-errors).                                                      |
| PHP_DISPLAY_STARTUP_ERRORS           | Off       | Configures whether startup errors are printed or hidden. [See php.net](https://www.php.net/display-startup-errors).                                      |
| PHP_ERROR_REPORTING                  | Production `E_ALL & ~E_DEPRECATED & ~E_STRICT` Development: `E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE` | The desired logging level you'd like PHP to use. [See php.net](https://www.php.net/manual/en/function.error-reporting.php). |
| PHP_FPM_PM_MAX_CHILDREN              | 50        | The the maximum number of child processes. [See php.net](https://www.php.net/manual/en/install.fpm.configuration.php).                                   |
| PHP_FPM_PM_MAX_REQUESTS              | 500       | The number of requests each child process should execute before re-spawning. [See php.net](https://www.php.net/manual/en/install.fpm.configuration.php). |
| PHP_FPM_PM_MAX_SPARE_SERVERS         | 2         | The desired maximum number of idle server processes. [See php.net](https://www.php.net/manual/en/install.fpm.configuration.php).                         |
| PHP_FPM_PM_MIN_SPARE_SERVERS         | 2         | The desired minimum number of idle server processes. [See php.net](https://www.php.net/manual/en/install.fpm.configuration.php).                         |
| PHP_FPM_PM_PROCESS_IDLE_TIMEOUT      | 60s       | The number of seconds after which an idle process will be killed. [See php.net](https://www.php.net/manual/en/install.fpm.configuration.php).            |
| PHP_FPM_PM_START_SERVERS             | 2         | The number of child processes created on startup. [See php.net](https://www.php.net/manual/en/install.fpm.configuration.php).                            |
| PHP_MAX_EXECUTION_TIME               | 900       | Maximum execution time of each script, in seconds. [See php.net](https://www.php.net/max-execution-time).                                                |
| PHP_MAX_FILE_UPLOADS                 | 20        | The maximum number of files allowed to be uploaded simultaneously. [See php.net](https://www.php.net/manual/en/ini.core.php#ini.max-file-uploads).       |
| PHP_MAX_INPUT_VARS                   | 2000      | How many input variables will be accepted. [See php.net](https://www.php.net/manual/en/info.configuration.php#ini.max-input-vars).                       |
| PHP_MEMORY_LIMIT                     | 400M      | Maximum amount of memory a script may consume. [See php.net](https://www.php.net/memory-limit).                                                          |
| XDEBUG_ENABLE                        | (not set) | Set to `true` to enable `xdebug` extension.                                                                                                              |
| BLACKFIRE_ENABLED                    | (not set) | Set to `true` to enable `blackfire` extension.                                                                                                           |
| BLACKFIRE_SERVER_ID                  | (not set) | Set to Blackfire Server ID provided by Blackfire.io. Needs `BLACKFIRE_ENABLED` set to `true`.                                                             |
| BLACKFIRE_SERVER_TOKEN               | (not set) | Set to Blackfire Server Token provided by Blackfire.io. Needs `BLACKFIRE_ENABLED` set to `true`.                                                          |
| BLACKFIRE_LOG_LEVEL                  | 3         | Change the log level of the blackfire agent. Available values: `log verbosity level (4: debug, 3: info, 2: warning, 1: error)` [See blackfire.io](https://blackfire.io/docs/up-and-running/configuration/agent). |
