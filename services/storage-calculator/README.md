# Storage Calculator

This service is responsible for:

* Recording the used size of any Persistent-Volume (PV)
* Recording the used size of any database (`data` and `index`)

The result of the size calculations is sent to the Lagoon API.

The storage is measured in `KB`.

If you want to retrieve the storage for a given project, you can use GraphQL:

```graphql
query {
  projectByName(name: "PROJECT") {
    id
    name
    gitUrl
    productionEnvironment
    environments {
      name
      deployType
      environmentType
      storages {
        claim: persistentStorageClaim
        kb: bytesUsed
        updated
      }
    }
    openshift {
      id
      name
    }
  }
}
```

## Configuration

These are the environment variables that can influence the behaviour of the storage calculator:

* `PROJECT_REGEX` - defaults to `.+` (everything), this is a way to only include certain projects by name. This takes precedence of the Lagoon API `storageCalc` value for a given project.
* `LAGOON_STORAGE_LABEL_NAMESPACE` - if set (any value), then the namespace will be labeled with the current storage. This is useful for being able to see this information in the Kubernetes API.
* `LAGOON_STORAGE_IGNORE_REGEX` - you can optionally choose to ignore trying to mount and calculate the size of a given `PV` by name. This is useful for example to not try to calculate `RWO` PVs such as `solr` and `redis`. An example string this could be set to is `solr|redis|elasticsearch`.
