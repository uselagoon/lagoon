[Harbor](https://goharbor.io/) is used as the default package repository for Lagoon when deploying to Kubernetes infrastructure. Harbor provides a docker registry and a container security scanning solution provided by [Clair](https://coreos.com/clair/docs/latest/). 

<!-- Add a bit about how to log in to Harbor here once we integrate oidc login for Lagoon users -->

Once logged in, the first screen is a list of all repositories your user has access to. Each "repository" in Harbor correlates to a project in Lagoon. (Documentation on how to log in to Harbor will be coming soon!)
![Harbor Projects Overview](projects_overview.png)


Within each Harbor repository, you'll see a list of container images from all environments with a single Lagoon project. <flesh this out a bit>

![Harbor Repositories Overview](repositories_overview.png)

From here, you can drill down into an individual container in order to see its details, including an overview of its security scan results.

![Harbor Container Overview](container_overview.png)
