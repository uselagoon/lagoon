# DeployTarget Configurations

!!! Danger "Danger:"
    This is an alpha feature in Lagoon.
    The way DeployTarget Configurations work could change in future releases.
    If you decide to use this feature, you do at your own risk.

DeployTarget Configurations are a way to define how a project can deploy to multiple clusters. This feature is useful when you have two clusters, one which could be dedicated for running Production workloads, and another that is used for running Development workloads.

The configuration for these is not limited to just a Production/Development split though, so projects could perceivably target more than 1 specific cluster.

The basic idea of a DeployTarget configuration is that it is a way to easily define how a project can deploy across multiple clusters. It uses the existing methods of checking if a environment is valid

## Important Information

Before going in to how to configure a project to leverage DeployTarget configurations, there are some things you need to know.

1. Environments now have two new fields available to them to identify which DeployTarget(Kubernetes or Openshift) they have been created on.
  1. kubernetesNamespacePattern
  2. kubernetes
2. Once an environment has been deployed to a specific DeployTarget, it will always deploy to this target, even if the DeployTarget configuration, or project configuration is modified.
  1. This offers some safety to existing environments by preventing changes to DeployTarget configurations from creating new environments on different clusters.
  2. This is a new feature that is part of Lagoon, not specifically for DeployTarget configurations.
3. By default, if no DeployTarget configurations are associated to a project, that project will continue to use the existing methods to determine which environments to deploy. These are the following fields used for this.
  1. branches
  2. pullrequests
  3. kubernetesNamespacePattern
  4. kubernetes
4. As soon as any DeployTarget configurations are added to a project, then all future deployments for this project will use these configurations. What is defined in the project is ignored, and overwritten to inform users that DeployTarget configurations are in use.
5. DeployTarget configurations are weighted, which means that a DeployTarget configuration with a larger weight is prioritised over one with lower weight.
  1. The order in which they are returned by the query is the order they are used to determine where an environment should be deployed.
6. Active/Standby environments can only be deployed to the same cluster, so your DeployTarget configuration must be able to deploy both those environments to the same target.
7. Projects that leverage the `promote` feature of Lagoon must be aware that DeployTarget configurations are ignored for the `destination` environment.
  1. The destination environment will always be deployed to the same target that the `source` environment is on, your DeployTarget configuration MUST be configured correctly for this `source` environment.
  2. For safety, it is best to define both the `source` and `destination` environment in the same DeployTarget configuration branch regex.

## Configuration

To configure a project to use DeployTarget configurations, the first step is to add a configuration to a project.

The following GraphQL mutation can be used, this particular example will add a DeployTarget configuration to the project with the project ID 1.
It will allow only the branches that match the name `main` to be deployed, and pullrequests is set to `false`.
This means no other branches will be able to deploy to this particular target, and no pullrequests will be deployed to this particular target.
The `deployTarget` is ID 1, this could be a kubernetes cluster in a specific region, or designated for a specific type of workload (production or development).

```GraphQL
mutation addDeployTargetConfig{
  addDeployTargetConfig(input:{
    project: 1
    branches: "main"
    pullrequests: "false"
    deployTarget: 1
    weight: 1
  }){
    id
    weight
    branches
    pullrequests
    deployTargetProjectPattern
    deployTarget{
        name
        id
    }
    project{
        name
    }
  }
}
```

!!! Note "Note:"
    `deployTarget` is an alias the Kubernetes or Openshift ID in the Lagoon API

It is also possible to configure multiple DeployTarget configurations.

The following GraphQL mutation can be used, this particular example will add a DeployTarget configuration to the same project as above.
It will allow only the branches that regex match with `^feature/|^(dev|test|develop)$` to be deployed, and pullrequests is set to `true` so all pullrequests will reach this target.
The targeted cluster in this example is ID 2, which is a completely different kubernetes cluster to what was defined above for the `main` branch.

```GraphQL
mutation addDeployTargetConfig{
  addDeployTargetConfig(input:{
    project: 1
    branches: "^feature/|^(dev|test|develop)$"
    pullrequests: "true"
    deployTarget: 2
    weight: 1
  }){
    id
    weight
    branches
    pullrequests
    deployTargetProjectPattern
    deployTarget{
        name
        id
    }
    project{
        name
    }
  }
}
```

Once these have been added to a project, you can return all the DeployTarget configurations for a project using the following query

```GraphQL
query deployTargetConfigsByProjectId{
    deployTargetConfigsByProjectId(project:1){
        id
        weight
        branches
        pullrequests
        deployTargetProjectPattern
        deployTarget{
            name
            id
        }
        project{
            name
        }
    }
}
# result:
{
    "data": {
        "deployTargetConfigsByProjectId": [
        {
            "id": 1,
            "weight": 1,
            "branches": "main",
            "pullrequests": "false",
            "deployTargetProjectPattern": null,
            "deployTarget": {
                "name": "production-cluster",
                "id": 1
            },
            "project": {
                "name": "my-project"
            }
        },
        {
            "id": 2,
            "weight": 1,
            "branches": "^feature/|^(dev|test|develop)$",
            "pullrequests": "true",
            "deployTargetProjectPattern": null,
            "deployTarget": {
                "name": "development-cluster",
                "id": 2
            },
            "project": {
                "name": "my-project"
            }
        }
        ]
    }
}
```
