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

1.  `customer` The customer of the project. Can be used for an actual customer (if you use Lagoon in a multi-customer setup), or just to group multiple projects together. `customer` will hold the SSH Private Key that Lagoon will use to clone the Git repository of the project (the private key needs to be in a single string, where new lines are replaced by `\n` - see an example in /local-dev/api-data/api-data.sql)
2.  `openshift` The OpenShift Cluster that Lagoon should use to deploy to. Yes Lagoon is not only capable to deploy into the OpenShift that it is running itself, but actually to any OpenShift anywhere in the world. We need to know the following infos for this to work:
    1.  `name` - Unique identifier of the OpenShift
    2.  `consoleUrl` - URL of the OpenShift console (without any `/console` suffix)
    3.  `token` - the token of the `lagoon` Service Account created in this OpenShift (this is the same token that we also used during installation of Lagoon)
3.  `project` This is your git repository that should be deployed, it needs to contain a `.lagoon.yml` file so Lagoon knows what it should do.

Just fill all the `[fill me]` you can find in the examples below, copy it into the GraphiQL Client, press play and if everything went well, you should get a response which shows you the name of the customer & openshift object and the full project object that just has been created.

Congrats again 🎉!

#### Give Access to the Project

In Lagoon the individual developers are authenticating themselves via their SSH Keys. Via their SSH Keys they have access to multiple things:

1. The Lagoon API itself, where they can only see and edit projects they actually have access too
2. Remote Shell Access to containers that are running in projects they have access too
3. The Lagoon logging system, where a developer can find Request Logs, Container Logs, Lagoon Logs and many more.

First we need to add a new SSH Public key to the API:

```
mutation addSSHKey {
  addSshKey(input:{name:"[name]", keyValue:"[keyValue]", keyType:SSH_RSA}) {
    id
  }
}
```

- `name` - Your identificator for this SSH Key, can by any string
- `keyValue` - The actual SSH Public Key Value (withouth the type on front and no name at the end, so just something like `AAAAB3NzaC1yc2EAAAADAQ...3QjzIOtdQERGZuMsi0p`)
- `keyType` - The type of the key, there are currently two types supported by Lagoon: `SSH_RSA` and `SSH_ED25519`

After we added the key we can give this key access to either a single project or a whole customer, while access to a whole customer means that this SSH key has automatically access to all projects that are assigned to this customer.

```
mutation addSshKeyToCustomer {
  addSshKeyToCustomer(input:{customer:"[customer-name]", sshKey:"[sshKey-name]"}) {
    id
  }
}
```

or

```
mutation addSshKeyToProject {
  addSshKeyToProject(input:{project:"[project-name]", sshKey:"[sshKey-name]"}) {
    id
  }
}
```

That's it, now this SSH key can create Tokens via SSH, access containers and more.

Of corse it is possible to add an SSH Key to multiple customers and projects, whatever you need.

#### Add Notifications to the Project

If you like to know what exactly is going on during a deployment, we suggest to configure notifications for your project, they will provide:

- Push messages
- Build start information
- Build success or failure messages
- Many more

Like with the SSH Keys, we first add the Notification and then we connect the Notification to the Projects. As the Notifications can be quite different of their information they need, the notification types are built a bit more sofisticated and each Notification Type has it's own mutation:

```
mutation addNotificationSlack {
  addNotificationSlack(input:{name:"[name]]", channel:"[channel]", webhook:"[webhook]"}) {
    id
  }
}
```

```
mutation addNotificationRocketChat {
  addNotificationSlack(input:{name:"[name]]", channel:"[channel]", webhook:"[webhook]"}) {
    id
  }
}
```

- `name` - Is your own identificator for this Notification
- `channel` - Which channel should the message be sent to
- `webhook` - The URL of the webhook where messages should be sent, this is usally provided by the Chat System to you.

After we create that we can now connect this notification to our project:

```
mutation addNotificationToProject {
  addNotificationToProject(input:{notificationType: SLACK, project:"[project-name]", notificationName:"[notification-name]"}) {
    id
  }
}
```

Now for every deployment you should see messages appear in your defined channel.

## Example GraphQL queries

### Add New OpenShift Target

The OpenShift Cluster that Lagoon should use to deploy to. Yes, Lagoon is not only capable to deploy into the OpenShift that it is running itself, but actually to any OpenShift anywhere in the world. We need to know the following infos for this to work:

- `name` - Unique identifier of the OpenShift
- `consoleUrl` - URL of the OpenShift console (without any `/console` suffix)
- `token` - the token of the `lagoon` Service Account created in this OpenShift (this is the same token that we also used during installation of Lagoon)

```
mutation {
  addOpenshift(input: {name: "my-openshift", consoleUrl:"[fill me]", token: "[fill me]"}) {
    name
    id
  }
}
```

### Add New Customer

The customer of the project. Can be used for an actual customer (if you use Lagoon in a multi-customer setup), or just to group multiple projects together. `customer` will hold the SSH Private Key that Lagoon will use to clone the Git repository of the project (the private key needs to be in a single string, where new lines are replaced by `\n` see an example in /local-dev/api-data/api-data.sql)

```
mutation {
  addCustomer(input: {name: "[fill me]", privateKey: "[fill me]"}) {
    name
    id
  }
}
```

### Add New Project

This is your git repository that should be deployed, it needs to contain a `.lagoon.yml` file so Lagoon knows what it should do.

```
mutation {
  addProject(input:{name: "first-project", customer:[customer-id], openshift:[openshift-id], gitUrl: "[fill me]"}) {
    name
    customer {
      name
      id
    }
    openshift {
      name
      id
    }
    gitUrl,
    activeSystemsDeploy,
    activeSystemsRemove,
    branches,
    pullrequests
  }
}
```

### List Projects and Customers

This is a good comand to see an overview of all Projects, OpenShifts and Customers that exist within our Lagoon.

```
query whatIsThereAlready{
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

### Single Project

If you want to get an in depth look into a single project, this querry has been proven quite good:

```
query singleProject {
  projectByName(name: "[projectname]") {
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

### Project by Git URL

Don't remember how a project was called, but now the Git URL? Search no longer, there is an GraphQL Query for that:

```
query projectByGitUrl{
  projectByGitUrl(gitUrl: "git@server.com:org/repo.git") {
    name
  }
}
```

### Update Objects

The Lagoon GraphQL API cannot only display Objects and create Objects, it also has the capability to update exisitng Objects, all of this happens in full GraphQL best practices manner.

Update the branches to deploy within a project:

```
mutation editProjectBranches {
  updateProject(input:{id:109, patch:{branches:"^(prod|stage|dev|update)$"}}) {
    id
  }
}
```

Update the production Environment within a project (Important: Needs a redeploy in order for all changes to be reflected in the containers):

```
mutation editProjectProductionEnvironment {
  updateProject(input:{id:109, patch:{productionEnvironment:"master"}}) {
    id
  }
}
```

You can also combine multiple changes at once:

```
mutation editProjectProductionEnvironmentAndBranches {
  updateProject(input:{id:109, patch:{productionEnvironment:"master", branches:"^(prod|stage|dev|update)$"}}) {
    id
  }
}
```
