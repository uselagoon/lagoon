# GraphQL API

#### Connect to GraphQL API

Direct API interactions in Lagoon are done via GraphQL, we suggest the [GraphiQL App](https://github.com/skevy/graphiql-app) to connect. In order to authenticate to the API, we also need JWT (JSON Web Token) that allows us to use the GraphQL API as admin. To generate such token, open the terminal of the `auth-ssh` pod (you can either do that via the OpenShift UI or via `oc rsh`) and run:

        ./create_jwt.sh

This will return you with a long string, which is the jwt token.

We also need the URL of the API Endpoint, you can find that on the "Routes" of the OpenShift UI or via `oc xxxx`

Now we need a GraphQL client, technically this is just HTTP, but there is a nice UI that allows you to write GraphQL requests with autocomplete. Download, install and start it.

Enter the API Endpoint URL that we learned from before in `GraphQL Endpoint` and suffix it with `/graphql` (important!). Then click on "Edit HTTP Headers" and add a new Header:
- "Header name": `Authorization`
- "Header value": `Bearer [jwt token]` (make sure that the jwt token has no spaces, as this would not work)

Close the HTTP Header overlay (press ESC) and now we are ready to make the first GraphQL Request!

Enter this on the left window:

```
{
  allProjects {
    name
  }
}
```

And press the Play button (or press CTRL+ENTER). If all went well, you should see your first GraphQL response.

#### Create first Project

In order for Lagoon to deploy a project there is an example graphql in `create-project.gql`, which will create three API Objects:

1. `project` This is your git repository that should be deployed, it needs to contain a `.lagoon.yml` file so Lagoon knows what it should do.
2. `openshift` The OpenShift Cluster that Lagoon should use to deploy to. Yes Lagoon is not only capable to deploy into the OpenShift that it is running itself, but actually to any OpenShift anywhere in the world. We need to know the following infos for this to work:
        1. `name` - Unique identifier of the OpenShift
        2. `console_url` - URL of the OpenShift console (without any `/console` suffix)
        3. `token` - the token of the `lagoon` Service Account created in this OpenShift (this is the same token that we also used during installation of Lagoon)
3. `customer` The customer of the project. Can be used for an actual customer (if you use Lagoon in a multi-customer setup), or just to group multiple projects together. `customer` will hold the SSH Private Key that Lagoon will use to clone the Git repository of the project (the private key needs to be in a single string, where new lines are replaced by `\n` - see an example in /local-dev/api-data/api-data.sql)


Just fill all the `[fill me]` you can find in the examples below, copy it into the GraphiQL Client, press play and if everything went well, you should get a response which shows you the name of the customer & openshift object and the full project object that just has been created.

Congrats again 🎉!

## Example GraphQL queries

### Add New OpenShift Target
The OpenShift Cluster that Lagoon should use to deploy to. Yes, Lagoon is not only capable to deploy into the OpenShift that it is running itself, but actually to any OpenShift anywhere in the world. We need to know the following infos for this to work:   `name` - Unique identifier of the OpenShift   `console_url` - URL of the OpenShift console (without any `/console` suffix)   `token` - the token of the `lagoon` Service Account created in this OpenShift (this is the same token that we also used during installation of Lagoon)

```
mutation {
  addOpenshift(input: {name: "my-openshift", console_url:"[fill me]", token: "[fill me]"}) {
    name
  }
}
```

### Add New Client
The customer of the project. Can be used for an actual customer (if you use Lagoon in a multi-customer setup), or just to group multiple projects together. `customer` will hold the SSH Private Key that Lagoon will use to clone the Git repository of the project (the private key needs to be in a single string, where new lines are replaced by `\n` see an example in /local-dev/api-data/api-data.sql)

```
mutation {
  addCustomer(input: {name: "[fill me]", private_key: "[fill me]"}) {
    name
  }
}
```

### Add New Project
This is your git repository that should be deployed, it needs to contain a `.lagoon.yml` file so Lagoon knows what it should do.

```
mutation {
  addProject(input:{name: "first-project", customer:"customer-name", openshift: "my-openshift", git_url: "[fill me]"}) {
    name
    customer {
      name
    }
    openshift {
      name
    }
    git_url,
    active_systems_deploy,
    active_systems_remove,
    branches,
    pullrequests
  }
}
```

### List Projects and Clients
```
query whatIsThereAlready{
  allProjects {
    name
    git_url
    notifications {
      ...slack
    }
  }
  allOpenshifts {
    name
    id
  }
  allCustomers {
    name
    id
  }
}

fragment slack on NotificationSlack {
  name
}
```
