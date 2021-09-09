---
description: Lagoon supports deploytarget configurations, which are used to allow a project to deploy to multiple clusters
---

# DeployTarget Configurations

DeployTarget Configurations are a way to define how a project can deploy to multiple clusters. This feature is useful when you have two clusters, one which could be dedicated for running Production workloads, and another that is used for running Development workloads.

The configuration for these is not limited to just a Production/Development split though, so projects could perceivably target more than 1 specific cluster.

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

## Configuration

## Notes
