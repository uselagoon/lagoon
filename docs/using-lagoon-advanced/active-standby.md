# Active/Standby

Lagoon supports a method of deployment that switches production routes between two production environments. This reduces downtime, and provides easier rollbacks. It is more widely know in the industry as [blue-green deployments](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment).

For a more detailed explanation, watch our webinar:

<iframe width="560" height="315" src="https://www.youtube.com/embed/urq15chLvzQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Configuration

Configuring a project to use active/standby can be done in a few steps. You should have already [set up a new project](../using-lagoon-the-basics/setup-project.md) and [deployed the first production environment](../using-lagoon-the-basics/first-deployment.md).

### Project Settings

Your existing production environment is considered the current active environment. Before creating a second production environment, set the name of standby environment you will create:

=== "Lagoon CLI"

    ```bash title=""
    lagoon update project --project lagoon-demo --standby-production-environment prod-right
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation updateProject {
      updateProject(input: {
        id: 1234
        patch: {
          standbyProductionEnvironment: "prod-right"
        }
      }){
        name
        productionEnvironment
        standbyProductionEnvironment
      }
    }
    ```

### Routes

Routes are configured in the `.lagoon.yml` file, and by default are tied to a specific environment. Lagoon also supports production `active` and `standby` routes which always point to the respective active and standby environments. These routes are configured using the `production_routes` section in your `.lagoon.yml`.

!!! tip "Simplified with API Routes"
    Managing active/standby routes is much simpler when using [API-defined routes](advanced-route-concepts.md#activestandby-with-api-routes). Instead of configuring routes in both environment YAML files, you can create routes in the API and mark them as active or standby. The API automatically handles route switching during active/standby transitions.

An example of defining both `active` and `standby` routes is below. If `standby` routes are not needed, the section can be ommitted. For all route configuration options, see the [routes documentation for `.lagoon.yml`](http://localhost:8000/concepts-basics/lagoon-yml/#environment-routes).

```yaml title=".lagoon.yml"
production_routes:
  active:
    routes:
      - nginx:
        - www.example.com
  standby:
    routes:
      - nginx:
        - standby.example.com
```

!!! Warning
    Routes can only be switched between services with the same name. If you define an `active` route on an `api` service, you must have a service named `api` in both active and standby environments. It doesn't matter what container the service is running, as long as they share the service name.

Only the routes in the `production_routes` section are moved as part of an active/standby deployment, so make sure that if any `active` or `standby` routes were previously configured for a specific environment, to remove them from the `environments.{name}.routes` section of `.lagoon.yml`.

!!! Note
    Remember to commit your `.lagoon.yml` changes to both production branches.

Deploy your `.lagoon.yml` changes to the active environment. Now create the standby environment:

=== "Lagoon Dashboard"

    Visit the project page and click the `New Environment` button.

=== "Lagoon CLI"

    ```bash title=""
    lagoon deploy branch --project lagoon-demo --branch prod-right
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      deployEnvironmentBranch(input: {
        branchName: "prod-right"
        project: {
          name: "lagoon-demo"
        }
      })
    }
    ```

## Triggering a Switch Event

In order to keep downtime as short as possible, the process of switching does as little work as possible. It will verify some environment settings, move the routes between environments, and then update the Lagoon API to mark which environments are now active and standby. It does not perform any other deployment related steps like pre/post rollout tasks, or update environment variables.

Trigger a switch from the standby environment:

=== "Lagoon Dashboard"

    Visit the standby environment page and click the `Switch Active/Standby environments` button. You will be prompted to confirm your action.

=== "Lagoon CLI"

    ```bash title=""
    lagoon run activestandby --project lagoon-demo
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      switchActiveStandby(input: {
        project: {
          name: "lagoon-demo"
        }
      }) {
        id
        remoteId
      }
    }
    ```

A new task will be created in the current standby environment, which can be followed to track the status of the switch:

=== "Lagoon Dashboard"

    Visit the standby environment tasks page and check the latest `Active/Standby Switch` task.

=== "Lagoon CLI"

    ```bash title=""
    lagoon list tasks --project lagoon-demo --environment prod-right
    lagoon get task-by-id --id 1234 --logs
    ```

=== "Lagoon API"

    ```graphql title=""
    query {
      taskById(id: 1234) {
        id
        name
        created
        started
        completed
        status
        logs
      }
    }
    ```

!!! Warning
    If your application depends on env vars that would be changed during a deployment after an active/standby switch, you will need remove the dependency on those variables or manually run a deployment after the active/standby switch completes.

    For example, the `LAGOON_ROUTES` env var will not change, so the standby environment would still have the active routes listed even though it is now pointing at the new active environment instead. Running a deployment resets `LAGOON_ROUTES` to contain the correct routes.

## Workflow

An example of a full active/standby deployment might look like the following:

1. Current active production environment is `prod-left` and standby environment is `prod-right`
2. Developers use `development` and `pr` environments to test new features and bug fixes
3. A new release is ready to deploy

   1. All new code is committed to the `prod-right` branch and a new deployment is triggered for the standby environment `prod-right`
   2. The latest database and files are synced from the active environment, `prod-left`
   3. Developers verify the standby environment is ready using the standby route `standby.example.com`

4. Active/Standby is triggered to switch production traffic from `prod-left` to `prod-right`
5. If there are no issues, the process starts over with the current active production environment now being `prod-right`
6. If there were issues, active/standby is triggered again to revert production traffic back to `prod-left`

## Disabling Active/Standby

The current active production environment will become the only production environment. If the standby production environment is the one you want to keep, perform an active/standby switch so that it becomes the active environment.

Before deleting the standby environment, disable active/standby. The steps are a reverse of what was done to setup active/standby.

1. In your `.lagoon.yml` file in this (now active) branch, move the routes from the `production_routes.active.routes` section into the `environments.{name}.routes` section. This will make them attached to the environment directly. The `production_routes` section can be deleted, and any `standby` routes discarded. Deploy these changes to the active environment.
2. Delete the standby environment.
3. Update the project to remove the standby production environment name:

=== "Lagoon API"

    ```graphql title=""
    mutation {
      updateProject(input: {
        id: 1234
        patch: {
          standbyProductionEnvironment: ""
        }
      }){
        name
        productionEnvironment
        standbyProductionEnvironment
      }
    }
    ```

## Notes

When the active/standby trigger has been executed, the `productionEnvironment` and `standbyProductionEnvironments` will switch within the Lagoon API. Both environments are still classed as `production` environment types. We use the `productionEnvironment` to determine which one is labelled as `active`. For more information on the differences between environment types, read the [documentation for `environment types`](../concepts-advanced/environment-types.md)

```graphql title="Get environments via GraphQL"
query {
  projectByName(name: "lagoon-demo") {
    productionEnvironment
    standbyProductionEnvironment
  }
}
```

Before switching environments:

```graphql title="Results of environment query"
{
  "data": {
    "projectByName": {
      "productionEnvironment": "prod-left",
      "standbyProductionEnvironment": "prod-right"
    }
  }
}
```

After switching environments:

```graphql title="Results of environment query"
{
  "data": {
    "projectByName": {
      "productionEnvironment": "prod-right",
      "standbyProductionEnvironment": "prod-left"
    }
  }
}
```
