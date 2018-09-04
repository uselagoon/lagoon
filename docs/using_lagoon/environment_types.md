# Environment Types

Lagoon differentiates of currently two different Environment Types `production` and `development`

When setting up your project via the Lagoon GraphQL API you can define a `productionEnvironment`. On every deployment Lagoon executes, it checks if the current environment name matches what is defined in `productionEnvironment` and if yes, it will mark this environment as the `production` environment. This happens in two locations:

1. Within the GraphQL API itself
2. As an environment variable `LAGOON_ENVIRONMENT_TYPE` in every container

But that's it. Lagoon itself handles `development` and `production` environments exactly the same (in the end we wan't as few differences of the environments as possible).

There are a couple of things that will use this information:

- If your Lagoon Administrator has idling enabled, non-production environments will automatically be idled after four hours of non usage (no worry, they are started automatically when you visit them).
- Our default Drupal settings.php files load additional settings files for `development.settings.php` and `production.settings.php` so you can define settings and configurations different per environment type.
- If you try to delete an environment that is defined as the production environment (either via Webhooks or REST) Lagoon will politely refuse to delete the production environment, as it tries to prevent you from doing a mistake. In order to delete a production enviornment you can either change the `productionEnvironment` in the API or use the secret `forceDeleteProductionEnvironment: true` POST payload for the REST api.
- The Lagoon Administrator might use the production environment information for some additional things. Like at amazee.io we're calculating only the hits of the production environments to calculate the price of the hosting.