# Migration from amazee.io

If you are migrating from the amazee.io Legacy infrastructure over to Lagoon you will feel very familiar with everything. In the end, the same brains are behind both projects. There are some changes though and this will explain you each of them.

## Migration

The migration itself will be done by the amazee.io team, we have fully automated migration scripts and will release them soon, until then: Lean back and let the amazee.io team do that work for you :)

## Pygmy required, migrate from cachalot.

Lagoon local development environments are built for `pygmy`, which itself is based on Docker for Mac/Windows. There have been great performance improvements in the last months and we feel comfortable migrating everybody to `pygmy`. `pygmy` can run the Legacy and Lagoon projects at the same time.

If you are already using `pygmy`, then you can skip this. Here's how to migrate from `cachalot` to `pygmy`:

1. Make sure that you have all local code committed and all local databases and files synced. There is, unfortunately, no way to migrate the databases over to pygmy, so make sure that there is nothing you will be sad about if it is gone.
2. Remove cachalot VM: `cachalot destroy`
3. Uninstall cachalot: `gem uninstall cachalot` (maybe needs sudo)
4. Remove an eventual `eval $(cachalot env)` from `~/.bash_profile`, `~/.zshrc` or `~/.config/fish/config.fish`
5. Follow the `pygmy` installation process: http://lagoon.readthedocs.io/en/latest/using_lagoon/#requirements

## New services/containers in `docker-compose.yml`

If you look at a `docker-compose.yml` which is shipped with a Lagoon project you will see that it grew a bit in size. This is because Lagoon uses containers for each service individually, which is much better for extensibility and future proof-ness. If you want to have a look, see the `docker-compose.yml` of [drupal-example](https://github.com/amazeeio/drupal-example/blob/mariadb/docker-compose.yml).

## New `.lagoon.yml` file

Instead of an `.amazeeio.yml` file, Lagoon projects now are mostly configured via a `.lagoon.yml` file. Overall it's purpose is very similar to the `.amazeeio.yml` file, but it has some new cool features:

- Post-rollout tasks
- Custom Cronjobs
- Custom Routes
- and many more

See http://lagoon.readthedocs.io/en/latest/using_lagoon/#lagoonyml for more (WIP currently)

## Rename of `before_deploy` and `after_deploy` plus their location has moved

Lagoon has a new definition of Build and Post-Rollout tasks:

- Build tasks are defined in Dockerfiles and should be used for tasks that do not require connections to other services (like databases or so), they are therefore the new `before_deploy` tasks. Build tasks will profit from well-written Dockerfiles and will be speeded up by Docker Layer Caching
- Post-Rollout tasks are executed after the old running containers have been replaced by the new ones created by the deployment. They can be used for any tasks that need access to other services, like a cache clear of the CMS. These tasks are therefore the old `after_deploy` tasks.
- With the Legacy hosting system, we had `development` and `production` tasks for `before_deploy` and `after_deploy`. We believe this was a mistake and caused some issues we never had really the same system of development and production. With the new Lagoon system it is technically still possible to have different build or post-rollout tasks based on the environment type (aka `development` and `production`) or the branch name, but we don't suggest to use that too much, as it can cause again weird situations where something might work on development but not on production.

## Drush is still the same

You can use `drush sql-sync @remote @self` like you are used to, also `drush @remote ssh` still works the same.

## Everything is always in `/app`

With the Legacy system the absolute path of the files was different for every environment, like `/var/www/drupal-example_master/public_html` and `/var/www/drupal-example_develop/public_html`. This is now resolved and your files will always be in `/app` no matter on which server or which environment you are.

## New Environment Variables

As Lagoon is a fully open source project and is actually does not want too many ties to amazee.io itself, we renamed all Environment variables. The new settings.php files will automatically reflect that, but if you are interested to have a look at the settings.php of the drupal-example: https://github.com/amazeeio/drupal-example/blob/master/web/sites/default/settings.php

## Non-predictable user ids

Lagoon is based on OpenShift and OpenShift puts one thing very high: Security. Not only is each project completely encapsulated in its own virtual network, each container is also run with a random user id. This brings much higher security as a possible attacker cannot know the ID of the user during a Docker Build step.
On the other side, this makes development a bit harder as we still want writeable persistent storage, so OpenShift runs the container with a known Group ID: 1 (root). This gives the container access to the files that have been written by previous containers but doesn't actually give you root access inside the container.
