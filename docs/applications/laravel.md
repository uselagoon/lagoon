# Laravel on Lagoon

There are multiple ways of running Laravel on Lagoon.

* You may choose to "lagoonize" your existing application yourself (see the [Lagoonizing](../lagoonizing/index.md) documentation).
* We have a Laravel example repo of a [simple Lagoonized Laravel installation](https://github.com/lagoon-examples/laravel-example-simple) for you to have a look at.
* (Recommended) We provide a tool called ["Sail:onLagoon"](../other-tools/sail.md) that will take a standard Laravel Sail application and generate the appropriate Lagoon configuration files for you.

## App environment key

In order to set your app key, set the `APP_KEY` [environment variable](../concepts-advanced/environment-variables.md), either via the cli or the UI.

This eliminates the need to store the key in code (in, for instance, a `.env` file).

You can generate an app key by running the `php artisan key:generate --show`, which will output a valid key, rather than adjusting the project files.
