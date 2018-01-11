# Example GraphQL queries

## Add New Client and Project
mutation {
  # The customer of the project. Can be used for an actual customer (if you use Lagoon in a multi-customer setup),
  # or just to group multiple projects together. `customer` will hold the SSH Private Key that Lagoon will use to clone
  # the Git repository of the project (the private key needs to be in a single string, where new lines are replaced by `\n`
  # see an example in /local-dev/api-data/api-data.sql)
  addCustomer(input: {name: "customer-name", private_key: "[fill me]"}) {
    name
  }

  # The OpenShift Cluster that Lagoon should use to deploy to. Yes Lagoon is not only capable to deploy into the OpenShift that
  # it is running itself, but actually to any OpenShift anywhere in the world. We need to know the following infos for this to work:
  #   `name` - Unique identifier of the OpenShift
  #   `console_url` - URL of the OpenShift console (without any `/console` suffix)
  #   `token` - the token of the `lagoon` Service Account creted in this OpenShift (this is the same token that we also used during installation of Lagoon)
  addOpenshift(input: {name: "my-openshift", console_url:"[fill me]", token: "[fill me]"}) {
    name
  }

  # This is your git repository that should be deployed, it needs to contain a `.lagoon.yml` file so Lagoon knows what it should do.
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
