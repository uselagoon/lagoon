# Harbor

[Harbor](https://goharbor.io/) is used as the default package repository for Lagoon when deploying to Kubernetes infrastructure. Harbor provides a Docker registry and a container security scanning solution provided by [Trivy](https://github.com/aquasecurity/trivy).

!!! Note
    When running Lagoon locally, the configuration for Harbor is handled entirely automagically.
<!-- markdown-link-check-disable-next-line -->
If you are running Lagoon locally, you can access that UI at [localhost:8084](https://localhost:8084/). The username is `admin` and the password is `admin`.

!!! Note
    If you are hosting a site with a provider, they may not allow customer access to the Harbor UI.

Once logged in, the first screen is a list of all repositories your user has access to. Each "repository" in Harbor correlates to a project in Lagoon.

![Harbor Projects Overview](../../images/projects_overview.png)

Within each Harbor repository, you'll see a list of container images from all environments with a single Lagoon project.

![Harbor Repositories Overview](../../images/repositories_overview.png)

From here, you can drill down into an individual container in order to see its details, including an overview of its security scan results.

![Harbor Container Overview](../../images/container_overview.png)
