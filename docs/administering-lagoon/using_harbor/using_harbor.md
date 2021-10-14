[Harbor](https://goharbor.io/) is used as the default package repository for Lagoon when deploying to Kubernetes infrastructure. Harbor provides a docker registry and a container security scanning solution provided by [Trivy](https://github.com/aquasecurity/trivy).

**Note** When running Lagoon locally, the configuration for Harbor is handled entirely automagically.

<!-- markdown-link-check-disable-next-line -->
If you are running Lagoon locally, you can access that UI at [localhost:8084](https://localhost:8084/). The username is `admin` and the password is `admin`

**Note:** If you are hosting a site with amazee.io, we do not allow customer access to the Harbor UI within amazee.io's Lagoon.

Once logged in, the first screen is a list of all repositories your user has access to. Each "repository" in Harbor correlates to a project in Lagoon.

![Harbor Projects Overview](projects_overview.png)

Within each Harbor repository, you'll see a list of container images from all environments with a single Lagoon project.

![Harbor Repositories Overview](repositories_overview.png)

From here, you can drill down into an individual container in order to see its details, including an overview of its security scan results.

![Harbor Container Overview](container_overview.png)


## How Harbor interacts with the Problems Database

Lagoon can respond to Harbor webhook scan events and, if the result set matches a Project environment, will use the results and generate entries in the Problems system.

By default, Lagoon tries to parse out the incoming Harbor repo to match the pattern `PROJECT/ENVIRONMENT/SERVICE` - so if we had a project FOO, with environments PROD and DEV, and each of these environments had services `nodejs` and `mariadb` - an incoming Harbor repo name of `FOO/DEV/mariadb` will tell us precisely which service this image scan corresponds to.

In the case where the Harbor repo name does not correspond to this schema, we need some way of mapping scans to the right Project/environment/service. To allow this, we introduce an object called a Harbor Scan Matcher. This is essentially a regex that is meant to match against incoming Harbor repo names that associates the scan with existing projects and environments (or a range of them).We make use named capture groups in our regexes to match Project, Environment, and Service names. If the name of an environment, project, or service is not present in your regex, you can assign a default name for each of these that will be used instead. This is best illustrated by an example.

Below we create a Harbor Scan Matcher that matches an incoming repo name for the FOO project - let's assume that the incoming repo name from Harbor does not contain anything corresponding to the environment name, so we'll by default assume that this is going to go to an environment named PROD.If the harbor repo name is something like `MY_ENTERPRISE_PROJECT-<ENVIRONMENT NAME>` we could match with by creating the following Harbor Scan Matcher:

```graphql
mutation addProblemHarborScan {
  addProblemHarborScanMatch(input: {name: "EnterpriseProjectMatcher", description:"Matches incoming Harbor Scans for FOO",
    defaultLagoonProject: "FOO"
    defaultLagoonService: "nodejs"
    regex: "^MY_ENTERPRISE_PROJECT-(?<lagoonEnvironmentName>.+)$"
  }) {
    id
    name
    description
    regex
  }
}
```

This will now match any incoming string of the form `MY_ENTERPRISE_PROJECT-<ENVIRONMENT Name>` - assign it to the FOO project and attach any vulnerabilities found to the `nodejs` service.This is an ADMIN ONLY function since the Harbor Scan Matchers need to be set across the entire Lagoon instance. If non-admin users could set these then it would be possible to reroute Harbor scans from one project to another.