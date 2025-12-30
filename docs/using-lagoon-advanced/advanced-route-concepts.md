# Advanced Route Concepts

Lagoon provides powerful routing capabilities beyond basic route configuration. This page covers advanced routing features that enable complex deployment patterns and flexible traffic management.

## Routes Defined in the API

!!! info "Beta Feature"
    API-defined routes is a beta feature that may need to be enabled on your Lagoon instance. Contact your platform administrator to enable this feature.

Routes can now be managed through the Lagoon API instead of solely via `.lagoon.yml` files. This provides a more dynamic way to manage routes without requiring code changes and redeployments.

### Overview

When a route is defined in the API and also exists in the `.lagoon.yml` file, the API route takes precedence. Any additional configuration in the `.lagoon.yml` is merged on top of the API configuration during deployment. In most cases, the API route will contain all necessary information and will override the `.lagoon.yml` configuration.

!!! tip
    Routes defined in the API are marked with `source: "API"` to distinguish them from YAML-based routes.

### Key Benefits

- **No code changes required**: Add, modify, or remove routes without editing repository files
- **Simplified Active/Standby**: Much easier management of active/standby environments
- **Dynamic management**: Change routes without triggering a full rebuild
- **Centralized control**: Manage routes through the UI or API

### Creating Routes

Routes can be created in either an attached or unattached state. An attached route is immediately associated with an environment and service, while an unattached route exists at the project level until you associate it with an environment.

#### Basic Route Creation

```graphql title="Create a route attached to an environment"
mutation {
  addRouteToProject(input:{
    domain: "domain.example.com"
    project: "lagoon-demo"
    environment: "main"
    service: "nginx"
  }){
    id
    domain
    source
    service
    tlsAcme
    insecure
    project {
      name
    }
    environment{
      name
    }
  }
}
```

Default values for `tlsAcme` (true) and `insecure` ("Redirect") are applied if not specified:

```json title="Response"
{
  "addRouteToProject": {
    "domain": "domain.example.com",
    "environment": {
      "name": "main"
    },
    "id": 6,
    "insecure": "Redirect",
    "project": {
      "name": "lagoon-demo"
    },
    "service": "nginx",
    "source": "API",
    "tlsAcme": true
  }
}
```

### Updating Routes

Modify route properties using the `updateRouteOnProject` mutation:

```graphql title="Update route settings"
mutation {
  updateRouteOnProject(input:{
    domain: "domain.example.com"
    project: "lagoon-demo"
    patch: {
      tlsAcme: false
      insecure: Allow
    }
  }){
    id
    domain
    tlsAcme
    insecure
  }
}
```

### Deleting Routes

```graphql title="Delete a route by ID"
mutation {
  deleteRoute(input:{id: 1})
}
```

### Moving Routes Between Environments

To move a route from one environment to another:

1. **Remove from current environment**:

```graphql title="Detach route from environment"
mutation {
  removeRouteFromEnvironment(input:{
    domain: "domain.example.com"
    environment: "main"
    project: "lagoon-demo"
  }){
    id
    project{
      name
    }
    environment{
      name
    }
  }
}
```

2. **Deploy the original environment** to remove the route from the cluster

3. **Attach to new environment**:

```graphql title="Attach route to new environment"
mutation {
  addOrUpdateRouteOnEnvironment(input:{
    domain: "domain.example.com"
    service: "nginx"
    environment: "dev"
    project: "lagoon-demo"
  }){
    id
    environment{
      name
    }
  }
}
```

4. **Deploy the new environment** to create the route in the cluster

### Advanced Features

#### Additional Domains

Add multiple domains to a single route (up to 25 additional domains). In Kubernetes, this creates a single ingress with multiple host entries, and if using Let's Encrypt, all domains will be on the same certificate.

```graphql title="Add additional domains"
mutation {
  updateRouteOnProject(input:{
    domain: "example.com"
    project: "lagoon-demo"
    patch: {
      additionalDomains: ["www.example.com", "example.org"]
    }
  }){
    domain
    additionalDomains
  }
}
```

!!! warning "Limits"
    There is a hard limit of 25 additional domains per route due to Let's Encrypt certificate size restrictions.

#### Path-Based Routes

Path-based routes allow you to direct traffic from specific paths to different backend services. You can add up to 10 path-based routes per route.

```graphql title="Add path-based routes"
mutation {
  updateRouteOnProject(input:{
    domain: "example.com"
    project: "lagoon-demo"
    patch: {
      pathRoutes: [
        {
          path: "/api/v1"
          toService: "api-backend"
        },
        {
          path: "/admin"
          toService: "admin-service"
        }
      ]
    }
  }){
    domain
    pathRoutes {
      path
      toService
    }
  }
}
```

See [Path-Based Routes](#path-based-routes-1) below for more details.

#### Annotations

Add custom ingress annotations to routes (up to 10 annotations per route):

```graphql title="Add ingress annotations"
mutation {
  updateRouteOnProject(input:{
    domain: "example.com"
    project: "lagoon-demo"
    patch: {
      annotations: [
        {
          key: "nginx.ingress.kubernetes.io/proxy-body-size"
          value: "100m"
        }
      ]
    }
  }){
    domain
    annotations {
      key
      value
    }
  }
}
```

For more information on annotations, see the [ingress annotations documentation](../concepts-basics/lagoon-yml.md#ingress-annotations).

### Active/Standby with API Routes

Using API routes with [Active/Standby](active-standby.md) environments is significantly simpler than using `.lagoon.yml` configurations. Instead of defining routes in both environment YAML files, you create routes in the API and mark them as `active` or `standby`.

When creating a route for an active/standby setup:

```graphql title="Create active route"
mutation {
  addRouteToProject(input:{
    domain: "example.com"
    project: "lagoon-demo"
    environment: "prod-left"
    service: "nginx"
    activeStandbyRouteType: "ACTIVE"
  }){
    domain
    activeStandbyRouteType
    environment {
      name
    }
  }
}
```

When an active/standby switch occurs, the API automatically moves routes to reflect their new environment assignments.

You can also add regular (non-active/standby) routes to your active/standby environments. These routes remain attached to their environment during switches, useful for environment-specific URLs.

!!! warning "Migration Note"
    If using API routes with active/standby, remove the `production_routes` configurations from your `.lagoon.yml` files. Using both API and `.lagoon.yml` routes simultaneously may cause unexpected issues.

### Autogenerated Routes

By default, autogenerated route configuration is only defined in `.lagoon.yml`. However, once you configure autogenerated routes in the API, the `.lagoon.yml` configuration is ignored.

#### Disable Autogenerated Routes for Project

```graphql title="Disable autogenerated routes"
mutation {
  updateAutogeneratedRouteConfigOnProject(
    input: {
      project: "lagoon-demo"
      patch: {
        enabled: false
      }
    }
  ) {
    enabled
  }
}
```

#### Enable for Specific Environment

Override project settings for a specific environment:

```graphql title="Enable for environment"
mutation {
  updateAutogeneratedRouteConfigOnEnvironment(
    input: {
      project: "lagoon-demo"
      environment: "main"
      patch: {
        enabled: true
      }
    }
  ) {
    enabled
  }
}
```

!!! info "No Inheritance"
    Environment autogenerated route configuration does not inherit from project configuration. All settings must be explicitly configured at the environment level.

### Deployment Requirements

After creating, updating, or deleting routes in the API, a deployment must occur for changes to take effect in the cluster. Routes are applied during the deployment process.

## Path-Based Routes

Path-based routes allow you to route traffic from specific URL paths to different backend services within the same environment, all using the same domain.

!!! warning
    Path-based routes can be complex and should only be used when necessary. Consider simpler alternatives like separate domains or subdomains when possible.

### How They Work

When a request comes in for a specific path on your domain, the ingress controller routes it to a different service than the default. For example:

- `example.com/` → `nginx` service
- `example.com/api/v1` → `api-backend` service
- `example.com/admin` → `admin-service` service

### Configuration Methods

Path-based routes can be configured in three ways:

1. **API Routes** (recommended) - See [Path-Based Routes in API](#path-based-routes) above
2. **Global autogenerated routes** - Applied to all environments
3. **Per-environment configuration** - Overrides global settings
4. **Custom routes** - For specific route configurations

### Autogenerated Path Routes

Global configuration in `.lagoon.yml`:

```yaml title=".lagoon.yml - Global path routes"
routes:
  autogenerate:
    pathRoutes:
      - fromService: nginx
        toService: api-backend
        path: /api/v1
```

Per-environment configuration:

```yaml title=".lagoon.yml - Per-environment path routes"
environments:
  main:
    autogeneratePathRoutes:
      - fromService: nginx
        toService: api-backend
        path: /api/v1
```

!!! info
    If per-environment path routes are defined, global path routes are ignored for that environment.

**Supported fields:**

- `fromService` - The autogenerated route service to add the path-based route to
- `toService` - The backend service to route traffic to
- `path` - The URL path to match

### Custom Route Path Routes

For specific custom routes:

```yaml title=".lagoon.yml - Custom route paths"
environments:
  main:
    routes:
      - nginx:
        - example.com:
            pathRoutes:
              - toService: api-backend
                path: /api/v1
```

!!! note
    The `fromService` field is omitted for custom routes since the route is already associated with a service.

### Additional Service Ports

When using multiple ports with the `lagoon.service.usecomposeports=true` label, service names include the port number as a suffix for non-default ports.

```yaml title="docker-compose.yml - Multiple ports"
services:
  nginx:
    build:
      context: .
      dockerfile: nginx.dockerfile
    labels:
      lagoon.type: nginx
      lagoon.service.usecomposeports: true
    ports:
      - '8080'

  node:
    build:
      context: .
      dockerfile: node.dockerfile
    labels:
      lagoon.type: basic
      lagoon.service.usecomposeports: true
    ports:
      - '1234'  # Default port, service name: "node"
      - '4321'  # Additional port, service name: "node-4321"
```

Route traffic to the additional port:

```yaml title=".lagoon.yml - Route to additional port"
environments:
  main:
    routes:
      - nginx:
        - example.com:
            pathRoutes:
              - toService: node-4321
                path: /api/v1
```

In this configuration:
- `example.com/` → `nginx` service on port 8080
- `example.com/api/v1` → `node` service on port 4321

For more information on additional service ports, see [Additional Service Ports](../concepts-basics/docker-compose-yml.md#additional-service-ports).

## External Service Type

!!! info "Advanced Feature"
    External service types enable cross-environment communication within the same Kubernetes cluster. This is an advanced feature requiring careful network policy configuration.

The external service type allows you to create service references that point to services in other environments without provisioning actual containers. This is useful for shared services accessed by multiple environments.

### How It Works

Instead of deploying a running container, Lagoon creates a Kubernetes Service with an `ExternalName` record that resolves to another environment's service. Combined with network policies, this enables controlled access to shared services.

!!! warning "Same-Cluster Only"
    External services work only when all environments are on the same Kubernetes cluster. The `domain` field can potentially enable cross-cluster communication if the domain is resolvable and reachable.

### Configuration

Define an external service in `docker-compose.yml`:

```yaml title="docker-compose.yml - External service"
services:
  shared-database:
    image: placeholder  # Required for local dev, ignored by Lagoon
    labels:
      lagoon.type: external
      lagoon.external.service: '{"name":"mariadb","project":"shared-services","environment":"main"}'
```

!!! tip "Local Development"
    The `image` or `build` context may be needed for local development but is ignored by Lagoon. Consider using [Docker Compose profiles](https://docs.docker.com/compose/how-tos/profiles/) to prevent these from starting locally if not needed.

**External service JSON fields:**

- `name` (required) - The service name in the other environment
- `project` (required) - The project name containing the service
- `environment` (required) - The environment name (e.g., `main`, `feature/branch`, `pr-123`)
- `domain` (optional) - A specific domain to use (overrides other fields)

### Network Policies

Network policies control which environments can access your services. By default, all Lagoon environments are isolated. Network policies grant access.

#### Organization-Level Access

Allow all projects in an organization:

```yaml title=".lagoon.yml - Organization access"
network-policies:
  - service: mariadb
    organizations:
      # Allow any environment from any project in example-org
      - name: example-org1

      # Allow only production environments from example-org2
      - name: example-org2
        environment-type: production

      # Allow all except specific projects
      - name: example-org3
        exclude-projects:
          - name: project-a
```

#### Project-Level Access

More granular control by project:

```yaml title=".lagoon.yml - Project access"
network-policies:
  - service: mariadb
    projects:
      # Allow any environment from example-project1
      - name: example-project1

      # Allow only main environment from example-project2
      - name: example-project2
        environment: main

      # Allow only production environments from example-project3
      - name: example-project3
        environment-type: production

      # Allow all except specific environments
      - name: example-project4
        exclude-environments:
          - name: feature/develop

      # Exclude all pull request environments
      - name: example-project5
        exclude-pullrequests: true
```

!!! info "Complex Policies"
    You can combine organization and project rules. For example, allow only production from an organization, then specifically permit development environments from certain projects.

#### Configuration Locations

Network policies can be defined in three places:

**1. Root level:**

```yaml title=".lagoon.yml"
network-policies:
  - service: mariadb
    organizations:
      - name: example-org
```

**2. Environment level:**

```yaml title=".lagoon.yml"
environments:
  main:
    network-policies:
      - service: mariadb
        organizations:
          - name: example-org
```

**3. Polysite environment level:**

```yaml title=".lagoon.yml"
example-project:
  environments:
    main:
      network-policies:
        - service: mariadb
          organizations:
            - name: example-org
```

Environment-level policies override root-level policies. Polysite environment policies override all others.

### Use Cases

**Shared Search**: Deploy a Solr server once, access from multiple environments:

```yaml title="Project A - Shared database"
# docker-compose.yml
services:
  solr:
    image: uselagoon/solr:latest
    labels:
      lagoon.type: solr
```

```yaml title="Project A - Network policy"
# .lagoon.yml
network-policies:
  - service: solr
    projects:
      - name: project-b
        environment: main
      - name: project-c
        environment-type: production
```

```yaml title="Project B - External service reference"
# docker-compose.yml
services:
  solr:
    image: uselagoon/solr:latest
    labels:
      lagoon.type: external
      lagoon.external.service: '{"name":"solr","project":"project-a","environment":"main"}'
```

!!! note "Local Development"
    When using external services, local development becomes more complex. Your local `docker-compose.yml` may need additional logic to replicate the shared service environment, such as running an actual Solr container locally instead of the external reference, or connecting between different Docker Compose stacks.

**API Gateway**: Central API gateway accessed by microservices in different environments.

**Shared Cache**: Redis instance shared across multiple applications.

**Shared Database**: Access a database from a different environment or project.

## See Also

- [Active/Standby Deployments](active-standby.md) - Blue-green deployment strategies
- [.lagoon.yml Routes](../concepts-basics/lagoon-yml.md#routes) - Basic route configuration
- [Ingress Annotations](../concepts-basics/lagoon-yml.md#ingress-annotations) - Customize ingress behavior
- [Service Types](../concepts-advanced/service-types.md) - Available Lagoon service types
- [docker-compose.yml](../concepts-basics/docker-compose-yml.md) - Docker Compose configuration
