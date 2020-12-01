# Active Standby

Lagoon supports Active/Standby (also known as blue/green) deployments.

## Configuration
To change an existing project to support active/standby you'll need to configure some project settings in the Lagoon API.

* `productionEnviromment` should be set to the branch name of the current environment that is active.
* `standbyProductionEnvironment` should be set to the branch name of the environment that will be in standby.

```
mutation updateProject {
  updateProject(input:{
    id:1234
    patch:{
      productionEnvironment:"production-brancha"
      standbyProductionEnvironment:"production-branchb"
    }
  }){
    standbyProductionEnvironment
    name
    productionEnvironment
  }
}
```

### `.lagoon.yml` - `production_routes`
To configure a project for active/standby in the `.lagoon.yml` file, you'll need to configure the `production_routes` section with any routes you want to attach to the `active` environment, and any routes to the `standby` environment. During an Active/Standby switch, these routes will migrate between the two environments.

If you have two production environments, `production-brancha` and `production-branchb`, with the current active production environment as `production-brancha` then:
* routes under `production_routes.active` will direct you to `production-brancha`.
* routes under `production_routes.standby` will direct you to `production-branchb`.

During an Active/Standby switch, the routes will swap:
* routes under `production_routes.active` will direct you to `production-branchb`.
* routes under `production_routes.standby` will direct you to `production-brancha`.

```
production_routes:
  active:
    routes:
      - nginx:
        - example.com:
            tls-acme: 'false'
        - active.example.com:
            tls-acme: 'false'
  standby:
    routes:
      - nginx:
        - standby.example.com:
            tls-acme: 'false'
```

> Note: Any routes that are under the section `environments.<branch>.routes` will not be moved as part of active/standby, these routes will always be attached to the environment as defined. Ensure that if you do need a specific route to be migrated during an active/standby switch, that you remove them from the `environments` section and place them under the `production_routes` section specific to if it should be an `active` or `standby` route.

## Triggering the active/standby switch
### via the UI
To trigger the switching of environment routes, you can visit the standby environment in the Lagoon UI and click on the button labeled `Switch Active/Standby environments`. You will be prompted to confirm your action.

Once confirmed, it will take you to the tasks page where you can view the progress of the switch.

### via the API
The following graphQL mutation can be executed which will start the process of switching the environment routes.
```
mutation ActiveStandby {
  switchActiveStandby(
    input:{
      project:{
        name:"drupal-example"
      }
    }
  ){
    id
  }
}
```

A task is created in the current active environment `tasks` tab when a switch event is triggered, you can check the status of the switch here.

Using the `id` from the `switchActiveStandby` mutation, we can also check the status of the task.
```
query getTask {
  taskById(id: <taskId>) {
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

## `drush` aliases

By default, projects will be created with the following aliases that will be available when active standby is enabled on a project.
* `lagoon-production`
* `lagoon-standby`

The `lagoon-production` alias will resolve to whichever environment is currently in the API as `productionEnvironment`, where `lagoon-standby` will always resolve to the environment that is defined as `standbyProductionEnvironment`.

> As the active/standby switch updates these as required, `lagoon-production` will always be the `active` environment.

These alias are configurable by updating the project, but be aware that changing them may require you to update any scripts that rely on them.

```
mutation updateProject {
  updateProject(input:{
    id:1234
    patch:{
      productionAlias:"custom-lagoon-production-alias"
      standbyAlias:"custom-lagoon-standby-alias"
    }
  }){
    productionAlias
    name
    standbyAlias
  }
}
```

## Notes

When the active/standby trigger has been executed, the `productionEnvironment` and `standbyProductionEnvironments` will switch within the Lagoon API. Both environments are still classed as `production` environment types. We use the `productionEnvironment` to determine which one is labelled as `active`. For more information on the differences between environment types, read the [documentation for `environment types`](environment_types.md#environment-types)

```
query projectByName {
  projectByName(name:"drupal-example"){
    productionEnvironment
    standbyProductionEnvironment
  }
}
```
Before switching environments
```
{
  "data": {
    "projectByName": {
      "productionEnvironment": "production-brancha",
      "standbyProductionEnvironment": "production-branchb"
    }
  }
}
```
After switching environments
```
{
  "data": {
    "projectByName": {
      "productionEnvironment": "production-branchb",
      "standbyProductionEnvironment": "production-brancha"
    }
  }
}
```