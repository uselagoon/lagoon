Place files in here that you want to add to your Drupal site.  You will also need to add them to the extra/file-mapping section in composer.json.

As per https://www.drupal.org/docs/develop/using-composer/using-drupals-composer-scaffold
e.g.
```
            "file-mapping": {
                "[web-root]/sites/default/all.settings.php": "assets/all.settings.php"
            },  
```



Settings files are loaded in this order:
* _Loaded by amazeeio/drupal-integrations_
  - settings.php
  - settings.lagoon.php
* _For settings and services that should be applied to all environments (dev, prod, staging, docker, etc)._
  - all.settings.php
  - all.services.yml
* _For settings and services that should be applied only for the production environment._
  - production.settings.php
  - production.services.yml
* _For settings and services that should be applied only for the development (Lagoon and local) environments._
  - development.settings.php
  - development.services.yml
* _For settings and services only for the local environment, these files will not be committed in Git!_
  - settings.local.php
  - services.local.yml
