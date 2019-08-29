# Step by Step: Getting Drupal ready to run on Lagoon

## 1. Lagoon Drupal Setting Files

In order for Drupal to work with Lagoon we need to teach Drupal about Lagoon and Lagoon about Drupal. This happens by copying specific YAML and PHP Files into your Git repository.

You find [these Files in our GitHub repository](https://github.com/amazeeio/lagoon/tree/master/docs/using_lagoon/drupal); the easiest way is to [download these files as a ZIP file](https://minhaskamal.github.io/DownGit/#/home?url=https://github.com/amazeeio/lagoon/tree/master/docs/using_lagoon/drupal) and copy them into your Git repository. For each Drupal version and database type you will find an individual folder. A short overview of what they are:

- `.lagoon.yml` - The main file that will be used by Lagoon to understand what should be deployed and many more things. This file has some sensible Drupal defaults, if you would like to edit or modify, please check the specific [Documentation for .lagoon.yml](/using_lagoon/lagoon_yml.md)
- `docker-compose.yml`, `.dockerignore`, and `*.dockerfile` (or `Dockerfile`) - These files are used to run your Local Drupal Development environment, they tell docker which services to start and how to build them. They contain sensible defaults and many commented lines, it should be pretty much self describing. If you would like to find out more, see [Documentation for docker-compose.yml]()
- `sites/default/*` - These .php and .yml files teach Drupal how to communicate with Lagoon containers both locally and in production. It also provides an easy system for specific overrides in development and production environments. Unlike other Drupal hosting systems, Lagoon never ever injects Drupal Settings files into your Drupal. Therefore you can edit them to your wish. Like all other files they contain sensible defaults and some commented parts.
- `drush/aliases.drushrc.php` - These files are specific to Drush and tell Drush how to talk to the Lagoon GraphQL API in order to learn about all Site Aliases there are.
- `drush/drushrc.php` - Some sensible defaults for Drush Commands.
- Add `patches` directory if you choose [drupal8-composer-mariadb](https://github.com/amazeeio/lagoon/tree/master/docs/using_lagoon/drupal/drupal8-composer-mariadb).

### Remark to `.gitignore`

Don't forget to make sure your `.gitignore` will allow you to commit the settings files (Drupal is shipped with `sites/*/settings*.php` and `sites/*/services*.yml` in .gitignore, remove that, as with Lagoon we don't ever have sensitive information in the Git repository.)

### Remark to Webroot in Drupal 8

Unfortunately the Drupal Community couldn't decide yet on a standardized webroot folder name. Some projects put Drupal within `web` others within `docroot` or somewhere else. The Lagoon Drupal Setting Files assume that your Drupal is within `web`, if this is different for your Drupal, please adapt the files accordingly.

## 2. Customise docker-compose.yml

Don't forget to customise the values in lagoon-project & LAGOON_ROUTE with your site specific name & the URL you'd like to access the site with:

## 3. Build Images

As next we need to build the defined images:

    docker-compose build

This will tell docker-compose to build the Docker Images for all containers that have an `build:` definition in the `docker-compose.yml`. Usually for Drupal this is the case for the `cli`, `nginx` and `php`. We do this because we want to run specific Build commands (like `composer install`) or inject specific environment variables (like `WEBROOT`) into the Images.

Usually building is not needed every time you edit your Drupal Code (as the Code is mounted into the Containers from your Host), but rebuilding does not hurt.
Plus Lagoon will build the exact same Docker Images also during a deploy, you can therefore check that your Build will also work during a deployment with just running `docker-compose build` again.

## 4. Start Containers

Now as the Images are built, we can start the Containers:

    docker-compose up -d

This will bring up all containers. After the command is done, you can check with `docker-compose ps` if all of them are fully up and didn't crash yet. If there is a problem, check the logs with `docker-compose logs -f [servicename]`.

If everything went well, open the `LAGOON_ROUTE` defined in `docker-compose.yml` (for example http://drupal.docker.amazee.io) and you should be greeted by a nice Drupal Error. Don't worry that's ok right now, most important is that it tries to load a Drupal site.

## 5. Rerun `composer install` (for Composer projects only)

In a local development environment you most probably open the Drupal Code in your favorite IDE and you also want all dependencies downloaded and installed, so connect into the cli container and run `composer install`:

    docker-compose exec cli bash
    composer install

This maybe sounds weird, as there was already a `composer install` executed during the Build step, let us explain:
- In order to be able to edit files on the Host and have them immediately available in the container, the default docker-composer.yml mounts the whole folder into the the containers (this happens with `.:/app:delegated` in the volumes section). This also means that all dependencies installed during the Docker build are overwritten with the files on the Host.
- Locally you probably want dependencies defined as `require-dev` in `composer.json` also existing, while on a production deployment they would just use unnecessary space. So we run `composer install --no-dev` in the Dockerfile and `composer install` manually.

## 6. Check Status and Install Drupal

Finally it's time to install a Drupal, but just before that we want to make sure everything works alright. We suggest to use Drush for that:

    docker-compose exec cli bash
    drush status

This should return something like:

    [drupal-example]cli-drupal:/app$ drush status
    [notice] Missing database table: key_value
    Drupal version       :  8.6.1
    Site URI             :  http://drupal.docker.amazee.io
    Database driver      :  mysql
    Database hostname    :  mariadb
    Database port        :  3306
    Database username    :  drupal
    Database name        :  drupal
    PHP binary           :  /usr/local/bin/php
    PHP config           :  /usr/local/etc/php/php.ini
    PHP OS               :  Linux
    Drush script         :  /app/vendor/drush/drush/drush
    Drush version        :  9.4.0
    Drush temp           :  /tmp
    Drush configs        :  /home/.drush/drush.yml
                            /app/vendor/drush/drush/drush.yml
    Drupal root          :  /app/web
    Site path            :  sites/default

Now it is time to install Drupal (if instead you would like to import an existing SQL File, please skip to step 6, but we suggest you install a clean Drupal in the beginning to be sure everything works.)

    drush site-install

This should output something like:

    [drupal-example]cli-drupal:/app$ drush site-install
    You are about to DROP all tables in your 'drupal' database. Do you want to continue? (y/n): y
    Starting Drupal installation. This takes a while. Consider using the --notify global option.
    Installation complete.  User name: admin  User password: a7kZJekcqh
    Congratulations, you installed Drupal!

Now you can visit the URL defined in `LAGOON_ROUTE` and you should see a fresh and clean installed Drupal - Congrats!

![Congrats](https://media.giphy.com/media/XreQmk7ETCak0/giphy.gif)

## 7. Import existing Database Dump

If you have an already existing Drupal Site you probably want to import a database dump in your local site.

There are many different ways on how to create a database dump, if your current hosting provider has Drush installed, you can use the following:

    drush sql-dump --result-file=dump.sql

    Database dump saved to dump.sql


Now you have a `dump.sql` file that contains your whole database.

Copy this file into Git Repository and connect to the CLI, you should see the file in there:

    [drupal-example]cli-drupal:/app$ ls -l dump.sql
    -rw-r--r--    1 root     root          5281 Dec 19 12:46 dump.sql

Now you can import the Dump with before dropping the current database:

    drush sql-drop

    drush sql-cli < dump.sql

Verify that everything works with visiting the URL of your Project.

## 8. Drupal files directory

A Drupal Site also consists of the files directory. As the whole folder is mounted into the Docker Containers, just add the files into the correct folder (probably `web/sites/default/files`, `sites/default/files` or something similar).

## 9. Done!

You are done. The Lagoon Team wishes Happy Drupaling!

If you like to deploy your Drupal into Lagoon, follow the next Step: [Setup a new Project in Lagoon](../setup_project.md)
