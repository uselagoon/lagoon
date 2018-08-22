# GraphQL API

## Connect to GraphQL API

API interactions in Lagoon are done via GraphQL, we suggest the [GraphiQL App](https://github.com/skevy/graphiql-app) to connect. In order to authenticate to the API, we also need a JWT (JSON Web Token) which will authenticate you against the API via your SSH Public Key. To generate such token, use the Remote Shell via the `token` command:

```bash
ssh -p [PORT] -t lagoon@[HOST] token
```

Example for amazee.io:

```bash
ssh -p 32222 -t lagoon@ssh.lagoon.amazeeio.cloud token
```

This will return you with a long string, which is the jwt token.

We also need the URL of the API Endpoint, ask your Lagoon Administrator for this. On amazee.io this is https://api.lagoon.amazeeio.cloud/graphql

Now we need a GraphQL client, technically this is just HTTP, but there is a nice UI that allows you to write GraphQL requests with autocomplete. Download, install and start it.

Enter the API Endpoint URL. Then click on "Edit HTTP Headers" and add a new Header:

* "Header name": `Authorization`
* "Header value": `Bearer [jwt token]` (make sure that the jwt token has no spaces, as this would not work)

Close the HTTP Header overlay (press ESC) and now we are ready to make the first GraphQL Request!

Enter this on the left window:

```GraphQL
query whatIsThere {
  allProjects {
    id
    git_url
    name
    branches
    pullrequests
    production_environment
    environments {
      name
      environment_type
    }
  }
}
```

And press the Play button (or press CTRL+ENTER). If all went well, you should see your first GraphQL response.

## Mutations

The Lagoon GraphQL API cannot only display Objects and create Objects, it also has the capability to update existing Objects, all of this happens in full GraphQL best practices manner.

Update the branches to deploy within a project:

```GraphQL
mutation editProjectBranches {
  updateProject(input:{id:109, patch:{branches:"^(prod|stage|dev|update)$"}}) {
    id
  }
}
```

Update the production Environment within a project (Important: Needs a redeploy in order for all changes to be reflected in the containers):

```GraphQL
mutation editProjectProductionEnvironment {
  updateProject(input:{id:109, patch:{production_environment:"master"}}) {
    id
  }
}
```

You can also combine multiple changes into a single query:

```GraphQL
mutation editProjectProductionEnvironmentAndBranches {
  updateProject(input:{id:109, patch:{production_environment:"master", branches:"^(prod|stage|dev|update)$"}}) {
    id
  }
}
```
