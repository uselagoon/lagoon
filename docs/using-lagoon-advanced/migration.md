# Migrations from amazee.io

If you are migrating from the amazee.io legacy infrastructure over to Lagoon, you will notice that everything is very familiar. In the end, the same brains are behind both projects. There are some changes, however, and this documentation will explain each of them.

## Migration

The migration itself will be done by the amazee.io team. We have fully-automated migration scripts and will release them soon! Until then: lean back and let the amazee.io team do that work for you ☺.

## Pygmy required for local development, migrate from cachalot.

Lagoon local development environments are built for `pygmy`, which itself is based on Docker for Mac/Windows. There have been great performance improvements in the last months and we feel comfortable migrating everybody to `pygmy`. `pygmy` can run the legacy and Lagoon projects at the same time.

If you are already using `pygmy`, then you can skip this. Here's how to migrate from `cachalot` to `pygmy`:

{% hint style="danger" %}
Make sure that you have all local code committed and all local databases and files backed up or synced. There is, unfortunately, no way to migrate the databases over to pygmy, so make sure that there is nothing you will be sad about if it is gone.
{% endhint %}

1. Remove cachalot VM: `cachalot destroy`.
2. Uninstall cachalot: `gem uninstall cachalot` \(might need `sudo`\).
3. Remove `eval $(cachalot env)` from `~/.bash_profile`, `~/.zshrc` or `~/.config/fish/config.fish`.
4. [Follow the `pygmy` installation process.](../using-lagoon-the-basics/local-development-environments.md)

## New services/containers in `docker-compose.yml`

If you look at a `docker-compose.yml` file, which is shipped with a Lagoon project, you will see that it grew a bit in size. This is because Lagoon uses containers for each service individually, which is much better for extensibility and future proofing. If you want to have a look, [see this example file.](https://github.com/amazeeio/lagoon/blob/main/docs/docs/examples/drupal8-composer-mariadb/docker-compose.yml)

## New `.lagoon.yml` file

Instead of an `.amazeeio.yml` file, Lagoon projects now are mostly configured via a `.lagoon.yml` file. Overall, its purpose is very similar to the `.amazeeio.yml` file, but it has some new cool features:

* Post-rollout tasks.
* Custom cron jobs.
* Custom routes.
* and many more!

See [.lagoon.yml](../using-lagoon-the-basics/lagoon-yml.md) for more!

## Renaming of `before_deploy` and `after_deploy` - plus their location has moved

Lagoon has a new definition of build and post-rollout tasks:

* Build tasks are defined in Dockerfiles, and should be used for tasks that do not require connections to other services \(like databases\). They are the new `before_deploy` tasks. Build tasks will profit from well-written Dockerfiles and will be sped up by Docker layer caching.
* Post-rollout tasks are executed after the old running containers have been replaced by the new ones created by the deployment. They can be used for any tasks that need access to other services, like a cache clear of the CMS. These tasks are the old `after_deploy` tasks.
* With the legacy hosting system, we had `development` and `production` tasks for `before_deploy` and `after_deploy`. We believe this was a mistake and caused some issues because we never really had the same system of development and production. With the new Lagoon system, it is technically still possible to have different build or post-rollout tasks based on the environment type \(aka `development` and `production`\) or the branch name, but we suggest keeping them the same as much as possible, as it can still cause weird situations where something might work on development but not on production.

## Drush is still the same

You can use `drush sql-sync @remote @self` like you are used to, also `drush @remote ssh` still works the same.

## Everything is always in `/app`

With the legacy system, the absolute path of the files was different for every environment, like `/var/www/drupal-example_main/public_html` and `/var/www/drupal-example_develop/public_html`.

This is now resolved and your files will always be in `/app` no matter which server or environment you are in!

## New Environment Variables

Lagoon is a fully open-source project and does not want too many ties to amazee.io, so we renamed all environment variables. The new `settings.php` files will automatically reflect that, but if you are interested, have a look at the settings in [this example `settings.php` file](https://github.com/amazeeio/lagoon/blob/main/docs/docs/examples/drupal8-composer-mariadb/web/sites/default/settings.php).

## Non-predictable user ids

Lagoon is based on OpenShift, which puts one thing at a very high priority: **Security**.

Not only is each project completely encapsulated in its own virtual network, each container is also run with a random user id. This brings much higher security, as a possible attacker cannot know the ID of the user during a Docker build step.

On the other side, this makes development a bit harder as we still want writable persistent storage, so OpenShift runs the container with a known group ID: 1 \(root\). This gives the container access to the files that have been written by previous containers, but doesn't actually give you root access inside the container.

