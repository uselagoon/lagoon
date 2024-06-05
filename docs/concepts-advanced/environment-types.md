# Environment Types

Lagoon currently differentiates between two different environment types: `production` and `development`.

When setting up your project via the Lagoon GraphQL API, you can define a `productionEnvironment`. On every deployment Lagoon executes, it checks if the current environment name matches what is defined in `productionEnvironment`. If it does, Lagoon will mark this environment as the `production` environment. This happens in two locations:

1. Within the GraphQL API itself.
2. As an environment variable named `LAGOON_ENVIRONMENT_TYPE` in every container.

But that's it. Lagoon itself handles `development` and `production` environments in exactly the same way \(in the end we want as few differences of the environments as possible - that's the beauty of Lagoon\).

There are a couple of things that will use this information:

* By default, `development` environments are idled after 4 hours with no hits \(don't worry, they wake up automatically\). It is also possible for {{ defaults.helpstring }} to disable auto-idling on a per-environment basis, just ask!
* Our default Drupal `settings.php` files load additional settings files for `development.settings.php` and `production.settings.php` so you can define settings and configurations different per environment type.
* If you try to delete an environment that is defined as the production environment \(either via webhooks or REST\), Lagoon will politely refuse to delete the production environment, as it tries to prevent you from making a mistake. In order to delete a production environment, you can either change the `productionEnvironment` in the API or use the secret `forceDeleteProductionEnvironment: true` POST payload for the REST API.
* Sometimes {{ defaults.helpstring }} might use the production environment information for some additional things, such as calculating only the hits of the production environments to calculate the price of the hosting.
