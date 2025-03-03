# Environment Variables

Lagoon supports the use of environment variables, which are commonly used by applications to store configuration separate from code. There are multiple methods to set an env var and each Lagoon environment can have separate values.

## Environment Variables (Lagoon API)

Use Lagoon API env vars for config that you don't want to keep in your Git repository (like secrets or API keys). This prevents sensitive information from getting leaked due to accidental exposure of the code.

Env vars can be added via the [Lagoon dashboard](../interacting/lagoon-ui.md), the [Lagoon CLI](https://uselagoon.github.io/lagoon-cli/), or the [Lagoon API](../interacting/graphql.md).

!!! warning
    Adding or changing API env vars won't be reflected in a Lagoon environment until the next deployment.

Env vars have a `name`, `value`, `type`, and `scope`. The type and scope determine when and where the env vars are added to Lagoon environments.

### Types

Types are used to set env vars for a set of environments. An env var can be of type `organization`, `project`, or `environment`. Review the [precedence of all env vars](#environment-variable-precedence) to see how they interact with other types and methods.

#### Organization

Organization env vars are set for all environments, in all projects, in an organization. They can be overridden by project and environment env vars.

An example of setting an `organization` env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --organization-name lagoon-demo-org --scope runtime \
    --name SSMTP_MAILHUB --value mailhub.example.com
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          organization: "lagoon-demo-org"
          scope: RUNTIME
          name: "SSMTP_MAILHUB"
          value: "mailhub.example.com"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

#### Project

Project env vars are set for all environments in a project. They can be overridden by environment env vars.

An example of setting a `project` env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --project lagoon-demo --scope runtime \
    --name PHP_MEMORY_LIMIT --value 400M
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          project: "lagoon-demo"
          scope: RUNTIME
          name: "PHP_MEMORY_LIMIT"
          value: "400M"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

#### Environment

Environment env vars are set for a single Lagoon environment.

An example of setting an `environment` env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --project lagoon-demo --environment dev \
    --scope runtime --name LOG_LEVEL --value DEBUG
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          project: "lagoon-demo"
          environment: "dev
          scope: RUNTIME
          name: "LOG_LEVEL"
          value: "DEBUG"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

### Scopes

Scopes are used to set an env var for a specific context. An env var can have a scope of `build`, `runtime`, `global`, `container_registry` or `internal_container_registry`.

#### Buildtime

Buildtime env vars are only available during Docker image builds, and can be accessed by using the `ARG` instruction. Check the [Docker documention on `ARG`](https://docs.docker.com/reference/dockerfile/#arg) for all the ways to use this method.

Typically the `ARG` will go after the FROM. Read [the Docker documentation about ARG and FROM](https://docs.docker.com/engine/reference/builder/#understand-how-arg-and-from-interact).

An example of setting a `build` env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --project lagoon-demo --scope build \
    --name COMPOSER_MEMORY_LIMIT --value -1
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          project: "lagoon-demo"
          scope: BUILD
          name: "COMPOSER_MEMORY_LIMIT"
          value: "-1"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

#### Runtime

Runtime env vars are injected into all containers when they start.

An example of setting a `runtime` scoped env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --project lagoon-demo --environment dev \
    --scope runtime --name LOG_LEVEL --value DEBUG
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          project: "lagoon-demo"
          environment: "dev
          scope: RUNTIME
          name: "LOG_LEVEL"
          value: "DEBUG"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

#### Global

Global env vars are set at buildtime and runtime and follow the same rules as those scopes.

An example of setting a `global` scoped env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --project lagoon-demo --scope global \
    --name JAVA_OPTS --value '-Xmx512m'
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          project: "lagoon-demo"
          scope: GLOBAL
          name: "JAVA_OPTS"
          value: "-Xmx512m"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

#### Container Registry

Container registry scoped env vars can be used to authenticate to a private container registry so that Lagoon can pull custom and/or private images at buildtime. Check the full documentation on [container registries](../concepts-basics/lagoon-yml.md#container-registries) for more information.

!!! warning
    The scope `internal_container_registry` is not for general use, and shouldn't be used unless explicitly required.

An example of setting a `container_registry` scoped env var:

=== "Lagoon CLI"

    ```bash title=""
    lagoon add variable --project lagoon-demo --scope container_registry \
    --name REGISTRY_DOCKERHUB_USERNAME --value dockerhub_user_123
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      addOrUpdateEnvVariableByName(
        input: {
          project: "lagoon-demo"
          scope: GLOBAL
          name: "JAVA_OPTS"
          value: "-Xmx512m"
        }
      ) {
        id
        name
        scope
        value
      }
    }
    ```

## Environment Files (committed to Git Repo)

Use environment files for config that can be safely committed to a Git repository.

Environment files are only read by containers based on the [Lagoon `commons` base image](../docker-images/commons.md). They aren't read by Lagoon, but by the containers `ENTRYPOINT` scripts, which looks for them in the containers working directory. This means that these env vars are only available at runtime.

!!! info
    If environment files aren't loading, confirm that you're using Lagoon base images, that you're copying them into the contianer as part of your `Dockerfile`, and that your container has a `WORKDIR` setting that points to the location of these files.

The syntax of an environment file is `ENV_VAR_NAME="env var value"`:

```bash title=".env"
PHP_MEMORY_LIMIT="400M"
PHP_MAX_EXECUTION_TIME=900
DB_USER=$DB_USERNAME # Redefine DB_USER with the value of DB_USERNAME e.g. if your application expects another variable name for the Lagoon-provided variables.
```

### `.lagoon.env` and `.lagoon.env.BRANCHNAME`

Use `.lagoon.env` when you want to always set env vars, but only for Lagoon images.

Use `.lagoon.env.BRANCHNAME` when you want to set different env vars per environment. `BRANCHNAME` will be replaced by the env vars `$LAGOON_GIT_BRANCH` or `$LAGOON_GIT_SAFE_BRANCH`. For example, if you deployed the branch `main`, the file name would be `.lagoon.env.main`. Branch names that contain special characters are sanitized, so check the value of `$LAGOON_GIT_SAFE_BRANCH` to determine what the filename should be.

### `.env` and `.env.defaults`

Use `.env` and `.env.defaults` when you want to always set env vars, including for local development and non-Lagoon tools that also read them.

## Docker Environment Variables

### Docker Images

Env vars can be set in docker images by using the [`ENV` command](https://docs.docker.com/reference/dockerfile/#env) in your `Dockerfile`. These will be set when Lagoon builds your projects images and are available at runtime.

### Docker Compose

Lagoon doesn't use env vars set using Docker Compose when deploying your projects. You may still choose to set them for local development purposes. Review the [Docker Compose env var documentation](https://docs.docker.com/compose/how-tos/environment-variables/) for more information.


## Build Variables

Use build vars when you want to set an env var that is valid at buildtime, but only for a single deployment. Bulk deployments also support build vars.

!!! info
    Deployments triggered via webhooks won't receive build vars.

Build vars can be set for a deployment using the [Lagoon CLI](https://uselagoon.github.io/lagoon-cli/) or the [Lagoon API](../interacting/graphql.md).

An example use case would be disabling [post rollout tasks](../concepts-basics/lagoon-yml.md#post-rollout-tasks-post_rolloutirun), but only for a single deployment:

=== "Lagoon CLI"

    ```bash title=""
    lagoon deploy latest --project lagoon-demo --environment main \
    --buildvar LAGOON_POSTROLLOUT_DISABLED=true
    ```

=== "Lagoon API"

    ```graphql title=""
    mutation {
      deployEnvironmentLatest(input: {
        environment: {
          name: "main"
          project: {
            name: "lagoon-demo"
          }
        }
        buildVariables: {
          name: "LAGOON_POSTROLLOUT_DISABLED"
          value: "true"
        }
      })
    }
    ```

## Environment Variable Precedence

Since env vars may be duplicated in different methods, there's an order in which they're set that determines which value will be used. The order follows, with most specific listed first:

1. [Build vars](#build-variables)
2. [Env vars (Lagoon API)](#environment-variables-lagoon-api)
  1. Environment specific
  2. Project wide
  3. Organization wide

3. [Docker env vars](#docker-images)
4. [Env files](#environment-files-committed-to-git-repo)
  1. Env vars defined in `.lagoon.env.BRANCHNAME`
  2. Env vars defined in `.lagoon.env`
  3. Env vars defined in `.env`
  4. Env vars defined in `.env.defaults`
