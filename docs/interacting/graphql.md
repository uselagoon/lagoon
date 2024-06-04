# GraphQL

## Connect to GraphQL API

API interactions in Lagoon are done via GraphQL. In order to authenticate to the API, you need a JWT (JSON Web Token), which will authenticate you against the API via your SSH public key.

To generate this token, use the remote shell via the `token` command:

```bash title="Get token"
ssh -p [PORT] -t lagoon@[HOST] token
```

{{ defaults.name }} connection string:

```bash title="Get {{ defaults.name }} token"
ssh -p {{ defaults.sshport }} -t lagoon@{{ defaults.sshhostname }} token
```

This will return a long string, which is the JWT token.

We also need the URL of the API endpoint. Contact {{ defaults.helpstring }} for this.
<!-- markdown-link-check-disable-next-line -->
For {{ defaults.name }} this is [`https://{{ defaults.apiaddress }}/graphql`](https://{{ defaults.apiaddress }}/graphql/graphql).

Now we need a GraphQL client! Technically this is just HTTP, but we suggest GraphiQL. It has a nice UI that allows you to write GraphQL requests with autocomplete. Download, install and start it. \[[GraphiQL App](https://github.com/skevy/graphiql-app)\]

Enter the API endpoint URL. Then click on "Edit HTTP Headers" and add a new Header:

* "Header name": `Authorization`
* "Header value": `Bearer [jwt token]` \(make sure that the JWT token has no spaces, that won't work\)

![Editing HTTP Headers in the GraphiQL UI.](../images/graphiql-2020-01-29-18-05-54.png)

Close the HTTP Header overlay \(press ESC\) and now you are ready to make your first GraphQL Request!

Enter this on the left window:

```graphql title="Get all projects"
query whatIsThere {
  allProjects {
    id
    gitUrl
    name
    branches
    pullrequests
    productionEnvironment
    environments {
      name
      environmentType
    }
  }
}
```

And press the ▶️ button \(or press CTRL+ENTER\).

![Entering a query in the GraphiQL UI.](../images/graphiql-2020-01-29-18-07-28.png)

If all went well, you should see your first GraphQL response.

## Mutations

The Lagoon GraphQL API can not only display objects and create objects, but it also has the capability to update existing objects. All of Lagoon's GraphQL uses best practices.

!!! info

    Mutation queries in GraphQL modify the data in the data store, and return a value. They can be used to insert, update, and delete data. Mutations are defined as a part of the schema._

Update the branches to deploy within a project:

```graphql title="Update deploy branches"
mutation editProjectBranches {
  updateProject(input:{id:109, patch:{branches:"^(prod|stage|dev|update)$"}}) {
    id
  }
}
```

Update the production environment within a project:

!!! Warning
    This requires a redeploy in order for all changes to be reflected in the containers.

```graphql title="Update production environment"
mutation editProjectProductionEnvironment {
  updateProject(input:{id:109, patch:{productionEnvironment:"prod"}}) {
    id
  }
}
```

You can also combine multiple changes into a single query:

```graphql title="Multiple changes"
mutation editProjectProductionEnvironmentAndBranches {
  updateProject(input:{id:109, patch:{productionEnvironment:"prod", branches:"^(prod|stage|dev|update)$"}}) {
    id
  }
}
```
