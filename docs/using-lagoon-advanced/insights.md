# Lagoon Insights

*Warning, the Insights System is currently being reworked, so while most of this will still hold in some form, there may be some flux in terms of the details described below*

Lagoon insights is a rough collection of data related to the state of an environment.


# Facts

The Facts API is used to store arbitrary data against an environment. It is something like a more structured key/value store.

A fact consists of the following fields

* id - generated when a fact is inserted.
* environment - *NB* reference to the Environment targeted by the fact.
* name - the fact's name (eg "php-version", "db-size"), an arbitrary string.
* source - *NB* This is a text field used to describe where a fact is "from", properly, how the fact was generated. This is described in more detail below.
* description - arbitrary textual description of the fact.
* keyFact - boolean used internally. Marks a fact as being particularly salient for potentially highlighting in UI or other tools.
* type - the actual _type_ of the fact, defining operations that can be performed with data. Can be `TEXT`, `URL`, or `SEMVER`.
* category - arbitrary string, can be used for categorizing/grouping facts.
* references - Allows further arbitrary text data (such as urls) to be added to a fact.
* service - used to identify which service, where applicable, a fact came from (eg. `cli`, `php`, `node` etc.)

Importantly, a fact's uniqueness is determined by a combination of its environment, its name, and its source.

```
mutation insertFact(
  $env: Int!
  $name: String!
  $source: String!
  $description: String!
  $value: String!
  $service: String
) {
  addFact(
    input: {
      environment: $env
      name: $name
      source: $source
      description: $description
      type: TEXT
      value: $value
      service: $service
    }
  ) {
    id
    environment {
      name
    }
    name
    value
    source
    description
    type
    service
  }
}
```

## Updating facts, patterns and principle

 A typical challenge in working with a live list of continuously updated information like facts is to identify when a fact should be _removed_.
This is where the "source" field is useful.

Let's say that we have a list of facts that can expand/contract based on the state of a service. If we have, say, a Drupal site where we can install or remove modules more or less arbitrarily, and where we're using the facts DB to keep track of which modules are currently installed on the site.

There may exist a module that is _currently_ installed, but which remove at some future point. The problem here is that if we have some mechanism for communicating to the Facts API what _currently_ exists, it's not obvious how we remove data that _no longer_ exists.
This is where `source` becomes useful. It's gives us a way of removing _all_ facts from a particular source (like, say, a program that returns the current list of all installed modules on a site), allowing us to only have a list of the most recent data, without the worry of leaving old entries lying around.

This is what the `deleteFactsFromSource` mutation is for - it allows you to clear a particular set of facts before refreshing the data for that particular set.

```
mutation dfbs($env: Int!, $source: String!) {
  deleteFactsFromSource(input: {
    environment: $env,
    source: $source
  })
}
```



