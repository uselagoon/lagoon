# Drush 9

Unfortunately Drush 9 does not provide the possibility to inject dynamic Site Aliases like Drush 8 did. We are working with the Drush team to implement this again. In the meantime we have a workaround that allows you to use Drush 9 with Lagoon.

### Basic Idea

Drush 9 provides a new command `drush site:alias-convert` which can convert Drush 8 style site aliases over to the Drush 9 yaml site alias style. This will create a one time export of the site aliases currently existing in Lagoon and save them within `/app/drush/sites` which then are used when running a command like `drush sa`.

### Preparation

In order to be able to use `drush site:alias-convert` you need to do the following:

- rename the `aliases.drushrc.php` inside the `drush` folder to `lagoon.aliases.drushrc.php`

### Generate Site aliases

Now you can run the converting process:

- `drush site:alias-convert`

It's a good practice to commit the resulting yaml files into your git repo, so your fellow developers don't need to do the same all the time.

### Use Site Aliases

In Drush 9 all site aliases are prefixed with a group, in our case this is `lagoon`. You can show all site aliases with their prefix via:

```
drush sa --format=list
```

and to use them: `drush @lagoon.master ssh`

### Update Site Aliases

If a new environment in Lagoon has been created, you can just run `drush site:alias-convert` to update the site aliases file.