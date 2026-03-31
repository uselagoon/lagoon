# Local Development Environments

!!! note inline end
    You do not need to _install_ Lagoon locally to _use_ it locally! Lagoon is the system that **deploys** your local dev environment to your production environment, it's **not** the environment itself.

Local dev environments can be used to shorten the development cycle for applications by not requiring full deployments anytime a code change needs testing. Lagoon deploys standard Docker images, which can be run locally with just [Docker](https://docs.docker.com/engine/) and [Docker Compose](https://docs.docker.com/compose/).

Docker lacks features that provide for a nice local development experience, so advanced local dev products have been created to provide, among other things:

* Reverse proxy for memorable URLs and HTTPS support.
* DNS service to resolve local URLs.
* SSH agent to use SSH keys within containers.
* Mail service to intercept and display emails locally.

Some local dev products, listed below, have enhanced support for Lagoon.

## Drupal

### [Pygmy Stack](https://pygmystack.github.io/pygmy/)

The Pygmy Stack is an open source, minimal `cli` tool on top of Docker that runs Lagoon Docker images and provides the previouly mentioned local dev features. Recommended for those that prefer mimicking production environments over features.

Lagoon integration:

 - Runs same Docker images locally as are running in Lagoon.
 - Automatic settings from Lagoon config files.

Read more about `pygmy` [usage](https://pygmystack.github.io/pygmy/usage/) or [installation](https://pygmystack.github.io/pygmy/installation/).

### [Lando](https://lando.dev/)

Lando is an open source, advanced `cli` tool for local dev environments and DevOps. It's customizable via plugins and config. Recommended for those that want to mimick production environments with extra features, and don't mind the complexity that comes with that.

Lagoon integration:

 - Runs some of the same Docker images locally as are running in Lagoon.
 - Automatic settings from Lagoon config files.
 - `lando push/pull` can sync with a Lagoon environment.
 - Lagoon `cli` and `lagoon-sync` included.

 [Read more about the Lando Lagoon plugin](https://docs.lando.dev/plugins/lagoon/).

### [DDEV](https://ddev.com/)

DDEV is an open source, advanced `cli` and `tui` for Docker-based PHP development environments. It has a large feature set and an extensive set of add-ons. Recommended for those that prefer ease of use over production similarity, and a large community.

Lagoon integration:

 - `ddev push/pull` can sync with a Lagoon environment.
 - Lagoon `cli` and `lagoon-sync` included.

[Read more about the DDEV and Lagoon integration](https://docs.ddev.com/en/stable/users/providers/lagoon/).

### Other

Other local dev systems like [Docksal](https://docksal.io/) or [Docker4Drupal](https://wodby.com/docs/stacks/drupal/local/) don't have explicit Lagoon support, but may still work using standard `ssh` and/or `rsync`.

## Laravel

### [Sail](https://laravel.com/docs/sail)

Laravel Sail is a light-weight command-line interface for interacting with Laravel's default Docker development environment. Sail provides a great starting point for building a Laravel application using PHP, MySQL, and Redis without requiring prior Docker experience.

Lagoon integration:

 - [`sailonlagoon`](https://github.com/uselagoon/sailonlagoon) simplifies the process of Lagoonizing Laravel Sail projects.
