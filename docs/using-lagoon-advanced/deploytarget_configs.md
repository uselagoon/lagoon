---
description: Lagoon supports deploytarget configurations, which are used to allow a project to deploy to multiple clusters
---

# DeployTarget Configurations

DeployTarget Configurations are a way to define how a project can deploy to multiple clusters. This feature is useful when you have two clusters, one which could be dedicated for running Production workloads, and another that is used for running Development workloads.

The configuration for these is not limited to just a Production/Development split though, so projects could perceivably target more than 1 specific cluster.

The basic idea of a DeployTarget configuration is that it is a way to easily define how a project can deploy across multiple clusters. It uses the existing methods of checking if a environment is valid

## Important Information

Before going in to how to configure a project to leverage DeployTarget configurations, there are some things you need to know.
1. Environments now have two new fields available to them to help identify which DeployTarget(Openshift) they have been created on
   1. openshiftProjectPattern
   2. openshift
2. Once an environment has been deployed to a specific DeployTarget, it will always deploy to this target, even if the DeployTarget conifguration, or project configuration is modified.
3. By default, if no DeployTarget configurations are associated to a project, that project will continue to use the following fields to determine what environments to deploy
   1. branches
   2. pullrequests
   3. openshiftProjectPattern
   4. openshift
4. As soon as any DeployTarget configurations are defined, then all deployments will use these. What is defined in the project is ignored.
5. DeployTarget configurations are weighted, which means that a DeployTarget configuration with a larger weight is prioritised over one with lower weight.
   1. The order in which they are returned by the query is the order they are used to determine where an environment should be deployed.
6. Active/Standby environments can only be deployed to the same cluster, so your DeployTarget configuration must be able to deploy both those environments to the same target cluster.
7. Projects that leverage the `promote` feature of Lagoon must be aware that DeployTarget configurations are not used for the `destination` environment.
   1. The destination environment will always be deployed to the same target cluster that the source is on, your DeployTarget configuration MUST be configured correctly for this environment.

## Configuration

To configure a project to use DeployTarget configurations, the first step is to add a configuration to a project.

The following GraphQL mutation can be used, this particular example will add a DeployTarget configuration to the project with the ID 1.
It will allow only the branches that match the name `main` to be deployed, as pullrequests is set to `false`. This means no other branches will be able to deploy to this particular target.
The targeted cluster is ID 1, this could be a kubernetes cluster in a specific region, or designated for a specific type of workload (production or development).
```
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

It is also possible to configure another DeployTarget configuration, the following GraphQL mutation can be used, this particular example will add a DeployTarget configuration to the same project above.
It will allow only the branches that regex match with `^feature/|^(dev|test|develop)$` to be deployed, and pullrequests is set to `true` so all pullrequests will reach this target.
The targeted cluster in this example is ID 2, which is a completely different cluster to what was defined above for the `main` branch.
```
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

Once these are added to a project, you can return all the DeployTarget configurations for a project using the following query
```
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

## Notes
