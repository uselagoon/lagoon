# Blackfire

## Blackfire variables

The Lagoon Base Images have support for Blackfire included in the PHP Images (see [the PHP images](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/entrypoints/80-php-blackfire.sh)).

In order to use Blackfire in Lagoon, these three environment variables need to be defined:

| Environment Variable | Default | Description |
| :--- | :--- | :--- |
| `BLACKFIRE_ENABLED` | \(not set\) | Used to enable `blackfire` extension with setting variable to `TRUE` or `true` |
| `BLACKFIRE_SERVER_ID` | \(not set\) | Set to Blackfire Server ID provided by Blackfire.io. Needs `BLACKFIRE_ENABLED` set to `true` |
| `BLACKFIRE_SERVER_TOKEN` | \(not set\) | Set to Blackfire Server Token provided by Blackfire.io. Needs `BLACKFIRE_ENABLED` set to `true` |

## Local Usage of Blackfire

For local usage of Blackfire with Lagoon Images, set the above environment variables for the PHP container. Here is an example for a Drupal application:

```yaml title="docker-compose.yml"

services:

[[snip]]

  php:
    [[snip]]

    environment:
      << : *default-environment # loads the defined environment variables from the top
      BLACKFIRE_ENABLED: TRUE
      BLACKFIRE_SERVER_ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      BLACKFIRE_SERVER_TOKEN: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

After restarting the containers, you should be able to profile via the [Blackfire Browser Plugin](https://blackfire.io/docs/profiling-cookbooks/profiling-http-via-browser) or the [Blackfire CLI](https://blackfire.io/docs/profiling-cookbooks/profiling-http-via-cli).

## Remote Usage of Blackfire

In order to use Blackfire in deployed Lagoon environments the same enviornment variables need to be set, this time via one of the possibilities of adding [environment variables to Lagoon](../concepts-advanced/environment-variables.md). Important: Environment variables set in the `docker-compose.yml` for local development are not used by Lagoon in remote environments!

## Debugging

The Blackfire Agent running in the PHP containers outputs logs as normal container logs, which can be seen via `docker-compose logs` or via the Lagoon Logging Infrastructure for remote environments.

By default the Logs are set to Level `3` (info), via the environment variable `BLACKFIRE_LOG_LEVEL` the level can be increased to `4` (debug) to generate more debugging ouput.
