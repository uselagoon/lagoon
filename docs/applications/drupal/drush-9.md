---
description: >-
  Lagoon defaults to Drush 8. Drush 9 is used if you install Drush 9 into your
  Drupal site via Composer.
---

# Drush 9

## Aliases

Unfortunately, Drush 9 does not provide the ability to inject dynamic site aliases like Drush 8 did. We are working with the Drush team to implement this again. In the meantime, we have a workaround that allows you to use Drush 9 with Lagoon.

### Basic Idea

Drush 9 provides a new command, `drush site:alias-convert` , which can convert Drush 8-style site aliases over to the Drush 9 YAML site alias style. This will create a on- time export of the site aliases currently existing in Lagoon, and save them in `/app/drush/sites` . These are then used when running a command like `drush sa`.

### Preparation

In order to be able to use `drush site:alias-convert` , you need to do the following:

* Rename the `aliases.drushrc.php` inside the `drush` folder to `lagoon.aliases.drushrc.php`.

### Generate Site Aliases

You can now convert your Drush aliases by running the following command in your project using the `cli` container:

```bash title="Generate Site Aliases"
docker compose exec cli drush site:alias-convert /app/drush/sites --yes
```

It's good practice to commit the resulting YAML files into your Git repository, so that they are in place for your fellow developers.

### Use Site Aliases

In Drush 9, all site aliases are prefixed with a group. In our case, this is `lagoon`. You can show all site aliases with their prefix via:

```bash title="Show all site aliases"
drush sa --format=list
```

and to use them:

```bash title="Using Drush site alias"
drush @lagoon.main ssh
```

### Update Site Aliases

If a new environment in Lagoon has been created, you can run `drush site:alias-convert` to update the site aliases file. If running this command does not update `lagoon.site.yml`, try deleting `lagoon.site.yml` first, and then re-run `drush site:alias-convert`.

### Drush `rsync` from local to remote environments

If you would like to sync files from a local environment to a remote environment, you need to pass additional parameters:

```bash title="Drush rsync"
drush rsync @self:%files @lagoon.main:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

This also applies to syncing one remote environment to another, if you're not using the Lagoon tasks UI to copy files between environments.

For example, if you wanted to sync the files from `@lagoon.main` to `@lagoon.dev` , and ran `drush rsync @lagoon.main @lagoon.dev` locally, without the extra parameters, you would probably run into a "Cannot specify two remote aliases" error.

To resolve this, you would first need to SSH into your destination environment `drush @lagoon.dev ssh`, and then execute the `rsync` command with parameters similar to the above:

```bash title="Drush rsync"
drush rsync @lagoon.main:%files  @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

This is not necessary if you `rsync` from a remote to a local environment.

Also, we're [working with the Drush maintainers](https://github.com/drush-ops/drush/issues/3491) to find a way to inject this automatically.
