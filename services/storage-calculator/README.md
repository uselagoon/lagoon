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
