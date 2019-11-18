# Environment Variables

It is common to store API Tokens or credentials for applications in environment variables.
Following best practices those credentials are different per environment. We allow each environment to use a separate
set of environment variables defined in Environment Variables or Environment Files.

As there can be environment variables defined in either the Dockerfile of during runtime (via API Environment Variables), we have an hierarchy of Environment variables: Environment variables defined in lower numbers are stronger

1. Environment variables (defined via Lagoon API) - Environment specific
2. Environment variables (defined via Lagoon API) - Project wide
3. Environment variables defined in Dockerfile (`ENV` command)
4. Environment variables defined in `.lagoon.env.$BRANCHNAME` (if file exists and where $BRANCHNAME is the Branch this Dockerimage has been built for), use this for overwriting variables for only specific branches
5. Environment variables defined in `.lagoon.env` (if exists), use this for overwriting variables for all branches
6. Environment variables defined in `.env`
7. Environment variables defined in `.env.defaults`

## Environment Variables (Lagoon API)

We suggest to use the Lagoon API environment variable system for variables that you would like to not be existing in the Git Repo (like secrets or API keys), as they could be leaked by somebody having them on their local development environment.

The Lagoon API allows you to define Project wide or Environment specific variables, additionally they can be defined for a scope only buildtime or runtime. They are all created via the Lagoon GraphQL API, read more how to use the GraphQL API at [Using Lagoon » GraphQL API](./graphql_api.md).

### Runtime Environment Variables (Lagoon API)

Runtime Environment Variables are automatically made available in all containers, but they are only added or updated after an environment has been redeployed.

This defines a project wide runtime variable (available in all environments) for the project with id `463`:
```
mutation addRuntimeEnv {
  addEnvVariable(input:{type:PROJECT, typeId:463, scope:RUNTIME, name:"MYVARIABLENAME", value:"MyVariableValue"}) {
    id
  }
}
```

This defines a environment id `546` specific runtime variable (available only in that specific environment):
```
mutation addRuntimeEnv {
  addEnvVariable(input:{type:ENVIRONMENT, typeId:546, scope:RUNTIME, name:"MYVARIABLENAME", value:"MyVariableValue"}) {
    id
  }
}
```

### Buildtime Environment Variables (Lagoon API)

Buildtime Environment Variables are only available during a Build and need to be consumed in Dockerfiles via:

```
ARG MYVARIABLENAME
```

This defines a project wide buildtime variable (available in all environments) for the project with id `463`:
```
mutation addBuildtimeEnv {
  addEnvVariable(input:{type:PROJECT, typeId:463, scope:BUILD, name:"MYVARIABLENAME", value:"MyVariableValue"}) {
    id
  }
}
```

This defines a environment id `546` specific buildtime variable (available only in that specific environment):
```
mutation addBuildtimeEnv {
  addEnvVariable(input:{type:ENVIRONMENT, typeId:546, scope:BUILD, name:"MYVARIABLENAME", value:"MyVariableValue"}) {
    id
  }
}
```

## Environment Files (existing directly in the Git Repo)

If you have environment variables that are safe to be saved within a Git repository, we suggest to add them directly into the Git Repo. As these variables will also be available within local development enviornments and are therfore more portable.

### `.lagoon.env.$BRANCHNAME`
If you want to define environment variables different per environment you can create a `.lagoon.env.$BRANCHNAME` e.g. for the master branch `.lagoon.env.master`. This helps you keeping environment variables apart between environments.

### `.env` and `.env.defaults`
`.env` and `.env.defaults` will act as the default values for environment variables if none other is defined. For example
as default environment variables for Pull-Request environments (see [Worfklows](./workflows.md#pull-requests)).

## Special Environment Variables

### `PHP_ERROR_REPORTING`

This variable, if set, will define the logging level you would like PHP to use. If not supplied, it will be set dynamically based on whether this is a production or development environment.

On production environments, this value defaults to `E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE`

On development environments, this value defaults to `E_ALL & ~E_DEPRECATED & ~E_STRICT`
