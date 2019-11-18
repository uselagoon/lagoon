# Drush 9

Lagoon defaults to Drush 8. Drush 9 is used if you install Drush 9 into your Drupal site via Composer. 

## Aliases

Unfortunately Drush 9 does not provide the possibility to inject dynamic Site Aliases like Drush 8 did. We are working with the Drush team to implement this again. In the meantime we have a workaround that allows you to use Drush 9 with Lagoon.

### Basic Idea

Drush 9 provides a new command `drush site:alias-convert` which can convert Drush 8 style site aliases over to the Drush 9 yaml site alias style. This will create a one time export of the site aliases currently existing in Lagoon and save them within `/app/drush/sites` which then are used when running a command like `drush sa`.

### Preparation

In order to be able to use `drush site:alias-convert` you need to do the following:

- rename the `aliases.drushrc.php` inside the `drush` folder to `lagoon.aliases.drushrc.php`

### Generate Site aliases

You can now convert your Drush aliases by running the following command in your project using the CLI container

- `docker-compose exec cli drush site:alias-convert /app/drush/sites --yes`

It's a good practice to commit the resulting yaml files into your git repo, so your fellow developers don't need to do the same all the time.

### Use Site Aliases

In Drush 9 all site aliases are prefixed with a group, in our case this is `lagoon`. You can show all site aliases with their prefix via:

```
drush sa --format=list
```

and to use them: `drush @lagoon.master ssh`

### Update Site Aliases

If a new environment in Lagoon has been created, you can just run `drush site:alias-convert` to update the site aliases file. If running this command does not update `lagoon.site.yml`, try deleting `lagoon.site.yml` first, and then re-run `drush site:alias-convert`.

### Drush rsync from local to remote environments

If you would like to sync files from a local environment to a remote environment, you need to pass additional parameters:

```
drush rsync @self:%files @lagoon.master:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX
```

This is also applies to syncing a remote environment to another remote environment, if you're not using the Lagoon Tasks UI to copy files between environments. 
For example, if you wanted to sync the files from `@lagoon.master` to `@lagoon.dev` and ran `drush rsync @lagoon.master @lagoon.dev` locally, you will probably run into a "Cannot specify two remote aliases" error. 
To resolve this, you would first need to ssh into your destination environment `drush @lagoon.dev ssh`, then execute the rsync command with parameters similar to the above: `drush rsync @lagoon.master:%files  @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX`. 

This is not necessary if you rsync from a remote to a local environment.

Also we're [working with the Drush Maintainers](https://github.com/drush-ops/drush/issues/3491) to find a way to inject this fully automatically.
