# GraphQL API

## Running GraphQL queries

Direct API interactions in Lagoon are done via GraphQL.

In order to authenticate with the API, we need a JWT (JSON Web Token) that allows us to use the GraphQL API as admin. To generate this token, open the terminal of the `auto-idler` pod via the OpenShift UI or `oc rsh` on the command line and run the following command:

```
./create_jwt.sh
```

This will return a long string which is the JWT token. Make a note of this as we will need it to send queries.

We also need the URL of the API endpoint, which can be found under "Routes" in the OpenShift UI or `oc get route api` on the command line. Make a note of this endpoint URL, which we will also need.

To compose and send GraphQL queries, we recommend [GraphiQL.app](https://github.com/skevy/graphiql-app), a desktop GraphQL client with features such as autocomplete. To continue with the next steps, install and start the app.

Under "GraphQL Endpoint", enter the API endpoint URL with `/graphql` on the end. Then click on "Edit HTTP Headers" and add a new header:

- "Header name": `Authorization`
- "Header value": `Bearer [JWT token]` (make sure that the JWT token has no spaces, as this would not work)

Press ESC to close the HTTP header overlay and now we are ready to send the first GraphQL request!

Enter this in the left panel

```graphql
{
  allProjects {
    name
  }
}
```

And press the ▶️ button (or press CTRL+ENTER). If all went well, your first GraphQL response should appear shortly afterwards in the right pane.

## Creating the first project

Let's create the first project for Lagoon to deploy! For this we'll use the queries from the GraphQL query template in [`create-project.gql`](https://github.com/amazeeio/lagoon/blob/master/docs/administering_lagoon/create-project.gql).

For each of the queries (the blocks starting with `mutation {`), fill in all of the empty fields marked by TODO comments and run the queries in GraphiQL.app. This will create one of each of the following three objects:

1. `customer` The customer of the project. Can be used for an actual customer (if you use Lagoon in a multi-customer setup), or just to group multiple projects together. `customer` will hold the SSH private key that Lagoon will use to clone the Git repository of the project.
2. `openshift` The OpenShift cluster that Lagoon should deploy to. Lagoon is not only capable of deploying to its own OpenShift but also to any OpenShift anywhere in the world.
3. `project` The project to be deployed, which is a git repository with a `.lagoon.yml` configuration file committed in the root.

## Allowing access to the project

In Lagoon each developer authenticates via their SSH key(s). This determines their access to:

1. The Lagoon API, where they can see and edit projects they have access to
2. Remote Shell Access to containers that are running in projects they have access to
3. The Lagoon logging system, where a developer can find request logs, container logs, Lagoon logs and more.

To allow access to the project, we first need to add a new user to the API:

```graphql
mutation {
  addUser(
    input: {
      email: "michael.schmid@example.com"
      firstName: "Michael"
      lastName: "Schmid"
      comment: "CTO"
    }
  ) {
    # TODO: Make a note of the user ID that is returned
    id
  }
}
```

Then we can add an SSH public key for the user to the API:

```graphql
mutation {
  addSshKey(
    input: {
      # TODO: Fill in the name field
      # This is a non-unique identifier for the SSH key
      name: ""
      # TODO: Fill in the keyValue field
      # This is the actual SSH public key (without the type at the beginning and without the comment at the end, ex. `AAAAB3NzaC1yc2EAAAADAQ...3QjzIOtdQERGZuMsi0p`)
      keyValue: ""
      # TODO: Fill in the keyType field
      # Valid values are either SSH_RSA or SSH_ED25519.
      keyType: SSH_RSA
      # TODO: Fill in the userId field
      # This is the user ID that we noted from the addUser query
      userId: 0
    }
  ) {
    id
  }
}
```

After we added the key we can grant the user access to either:

**Grant a user access to a single project**

```graphql
mutation {
  addUserToProject(
    input: {
      # TODO: Fill in the project field
      # This is the project name
      project: ""
      # TODO: Fill in the userId field
      # This is the user ID that we noted from the addUser query
      userId: 0
    }
  ) {
    id
  }
}
```

**Grant a user access to a customer (which will grant access to all projects of the customer)**

```graphql
mutation {
  addUserToCustomer(
    input: {
      # TODO: Fill in the customer field
      # This is the customer name
      customer: ""
      # TODO: Fill in the userId field
      # This is the user ID that we noted from the addUser query
      userId: 0
    }
  ) {
    id
  }
}
```

After running one or more of these kinds of queries, the user will be granted access to create tokens via SSH, access containers and more.

## Adding notifications to the project

If you want to know what is going on during a deployment, we suggest configuring notifications for your project, which provide:

- Push messages
- Build start information
- Build success or failure messages
- Many more

As notifications can be quite different of their information they need, each notification type has its own mutation.

As with users, we first add the notification:

```graphql
mutation {
  addNotificationSlack(
    input: {
      # TODO: Fill in the name field
      # This is your own identifier for the notification
      name: ""
      # TODO: Fill in the channel field
      # This is the channel for the message to be sent to
      channel: ""
      # TODO: Fill in the webhook field
      # This is the URL of the webhook where messages should be sent, this is usually provided by the chat system to you
      webhook: ""
    }
  ) {
    id
  }
}
```

After the notification is created, we can now assign it to our project:

```graphql
mutation {
  addNotificationToProject(
    input: {
      notificationType: SLACK
      # TODO: Fill in the project field
      # This is the project name
      project: ""
      # TODO: Fill in the notification field
      # This is the notification name
      notificationName: ""
    }
  ) {
    id
  }
}
```

Now for every deployment you will receive messages in your defined channel.

## Example GraphQL queries

### Adding a new OpenShift target

The OpenShift cluster that Lagoon should deploy to. Lagoon is not only capable of deploying to its own OpenShift but also to any OpenShift anywhere in the world.

```graphql
mutation {
  addOpenshift(
    input: {
      # TODO: Fill in the name field
      # This is the unique identifier of the OpenShift
      name: ""
      # TODO: Fill in consoleUrl field
      # This is the URL of the OpenShift console (without any `/console` suffix)
      consoleUrl: ""
      # TODO: Fill in the token field
      # This is the token of the `lagoon` service account created in this OpenShift (this is the same token that we also used during installation of Lagoon)
      token: ""
    }
  ) {
    name
    id
  }
}
```

### Adding a new customer

This query adds a customer which can be assigned one or more projects. Can be used for an actual customer (if you use Lagoon in a multi-customer setup), or just to group multiple projects together. Each customer has an SSH private key that Lagoon will use to clone the Git repository of the project.

```graphql
mutation {
  addCustomer(
    input: {
      # TODO: Fill in the name field
      # This is the customer name
      name: ""
      # TODO: Fill in the privateKey field
      # The private key is a string, with new lines represented by `\n`
      privateKey: ""
    }
  ) {
    name
    id
  }
}
```

### Adding a new project

This query adds a new project to be deployed, which is a git repository with a `.lagoon.yml` configuration file committed in the root.

```graphql
mutation {
  addProject(
    input: {
      # TODO: Fill in the name field
      # This is the project name
      name: ""
      # TODO: Fill in the customer field
      # This is the id of the customer to assign to the project
      customer: 0
      # TODO: Fill in the openshift field
      # This is the id of the OpenShift to assign to the project
      openshift: 0
      # TODO: Fill in the name field
      # This is the project name
      gitUrl: ""
    }
  ) {
    name
    customer {
      name
      id
    }
    openshift {
      name
      id
    }
    gitUrl
    activeSystemsDeploy
    activeSystemsRemove
    branches
    pullrequests
  }
}
```

### List projects and customers

This is a good query to see an overview of all projects, OpenShifts and customers that exist within our Lagoon.

```graphql
query {
  allProjects {
    name
    gitUrl
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
```

### Single project

If you want a detailed look at a single project, this query has been proven quite good:

```graphql
query {
  projectByName(
    # TODO: Fill in the project name
    name: ""
  ) {
    id
    branches
    gitUrl
    pullrequests
    productionEnvironment
    notifications(type: SLACK) {
      ... on NotificationSlack {
        name
        channel
        webhook
        id
      }
    }
    environments {
      name
      deployType
      environmentType
    }
    openshift {
      id
    }
    customer {
      id
      name
      sshKeys {
        id
        name
      }
    }
  }
}
```

### Querying a project by its Git URL

Don't remember the name of a project, but know the Git URL? Search no longer, there is an GraphQL Query for that:

```graphql
query {
  projectByGitUrl(gitUrl: "git@server.com:org/repo.git") {
    name
  }
}
```

### Updating objects

The Lagoon GraphQL API cannot only display objects and create objects, it also has the capability to update existing objects, using [a patch object](https://blog.apollographql.com/designing-graphql-mutations-e09de826ed97).

Update the branches to deploy within a project:

```graphql
mutation {
  updateProject(
    input: { id: 109, patch: { branches: "^(prod|stage|dev|update)$" } }
  ) {
    id
  }
}
```

Update the production environment within a project (important: this needs a redeploy in order for the changes to be reflected in the containers):

```graphql
mutation {
  updateProject(
    input: { id: 109, patch: { productionEnvironment: "master" } }
  ) {
    id
  }
}
```

You can also combine multiple changes at once:

```graphql
mutation {
  updateProject(
    input: {
      id: 109
      patch: {
        productionEnvironment: "master"
        branches: "^(prod|stage|dev|update)$"
      }
    }
  ) {
    id
  }
}
```
