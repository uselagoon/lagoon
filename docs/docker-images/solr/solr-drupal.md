# Solr-Drupal

The [Lagoon `solr-drupal` Docker image](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.7.Dockerfile), is a customized[`Solr` image](./) to use within Drupal projects in Lagoon.

The initial core created is `Drupal` , and it is created and configured starting from a Drupal customized and optimized configuration, copied from the [search\_api\_solr](https://www.drupal.org/project/search_api_solr) Drupal module.

The [documentation](./#lagoon-and-openshift-adaptions) outlines how to provide your own custom config.

For each Solr version, there is a specific `solr-drupal:<version>` Docker image.

## Supported Versions

* 5.5 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/5.5.Dockerfile)
* 6.6 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/6.6.Dockerfile)
* 7.7 [\[Dockerfile\]](https://github.com/uselagoon/lagoon-images/blob/main/images/solr-drupal/7.7.Dockerfile)

