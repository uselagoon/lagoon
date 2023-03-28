# Environment Variables

It is common to store API tokens or credentials for applications in environment variables.

Following best practices, those credentials are different per environment. We allow each environment to use a separate set of environment variables defined in environment variables or environment files.

As there can be environment variables defined in either the Dockerfile or during runtime \(via API environment variables\), we have a hierarchy of environment variables: environment variables defined in lower numbers are stronger.

1. Environment variables \(defined via Lagoon API\) - environment specific.
2. Environment variables \(defined via Lagoon API\) - project-wide.
3. Environment variables defined in Dockerfile \(`ENV` command\).
4. Environment variables defined in `.lagoon.env.$LAGOON_GIT_BRANCH` or `.lagoon.env.$LAGOON_GIT_SAFE_BRANCH` \(if the file exists and where `$LAGOON_GIT_BRANCH` `$LAGOON_GIT_SAFE_BRANCH` are the name and safe name of the branch this Docker image has been built for\), use this for overwriting variables for only specific branches.
5. Environment variables defined in `.lagoon.env` \(if it exists\), use this for overwriting variables for all branches.
6. Environment variables defined in `.env`.
7. Environment variables defined in `.env.defaults`.

`.lagoon.env.$LAGOON_GIT_BRANCH`, `.lagoon.env.$LAGOON_GIT_SAFE_BRANCH`, `.env`, and `.env.defaults` are all sourced by the individual containers themselves as part of running their entrypoint scripts. They are not read by Lagoon, but by the containers `ENTRYPOINT` scripts, which look for them in the containers working directory. If environment variables don't appear as expected, check if your container has a `WORKDIR` setting that points to somewhere else.

## Environment Variables \(Lagoon API\)

We suggest using the Lagoon API environment variable system for variables that you don't want to keep in your Git repo \(like secrets or API keys\), as they could be compromised by somebody having them on their local development environment or on the internet, etc.

The Lagoon API allows you to define project-wide or environment-specific variables. Additionally, they can be defined for a scope-only build-time or runtime. They are all created via the Lagoon GraphQL API. Read more on how to use the GraphQL API [in our GraphQL API](graphql.md) documentation.

### Runtime Environment Variables \(Lagoon API\)

Runtime environment variables are automatically made available in all containers, but they are only added or updated after an environment has been re-deployed.

This defines a project wide runtime variable \(available in all environments\) for the project with ID `463`:

```graphql title="Add runtime variable"
mutation addRuntimeEnv {
  addEnvVariable(
    input:{
      type:PROJECT,
      typeId:463,
      scope:RUNTIME,
      name:"MYVARIABLENAME",
      value:"MyVariableValue"
    }
  ) {
    id
  }
}
```

This defines a environment ID `546` specific runtime variable \(available only in that specific environment\):

```graphql title="Define environment ID."
mutation addRuntimeEnv {
  addEnvVariable(
    input:{
      type:ENVIRONMENT,
      typeId:546,
      scope:RUNTIME,
      name:"MYVARIABLENAME",
      value:"MyVariableValue"
    }
  ) {
    id
  }
}
```

### Build-time Environment Variables \(Lagoon API\)

Build-time environment variables are only available during a build and need to be consumed in Dockerfiles via:

```graphql title="Using build-time environment variables."
ARG MYVARIABLENAME
```

This defines a project-wide build-time variable \(available in all environments\) for the project with ID `463`:

```graphql title="Define a project-wide build-time variable."
mutation addBuildtimeEnv {
  addEnvVariable(
    input:{
      type:PROJECT,
      typeId:463,
      scope:BUILD,
      name:"MYVARIABLENAME",
      value:"MyVariableValue"}
  ) {
    id
  }
}
```

This defines an environment ID `546`specific build-time variable \(available only in that specific environment\):

```graphql title="Define environment ID."
mutation addBuildtimeEnv {
  addEnvVariable(input:{type:ENVIRONMENT, typeId:546, scope:BUILD, name:"MYVARIABLENAME", value:"MyVariableValue"}) {
    id
  }
}
```

Container registry environment variables are only available during a build and are used when attempting to log in to a private registry. They are used to store the password for the user defined in [Specials » `container-registries`](../using-lagoon-the-basics/lagoon-yml.md#specials). They can be applied at the project or environment level.

This defines a project-wide container registry variable \(available in all environments\) for the project with ID `463`:

```graphql title="Define project-wide container registry variable."
mutation addContainerRegistryEnv {
  addEnvVariable(
    input:{
      type:PROJECT,
      typeId:463,
      scope:CONTAINER_REGISTRY,
      name:"MY_OWN_REGISTRY_PASSWORD",
      value:"MySecretPassword"})
  ) {
    id
  }
}
```

This defines a environment id `546` specific container registry variable \(available only in that specific environment\):

```graphql title="Define environment ID."
mutation addContainerRegistryEnv {
  addEnvVariable(
    input:{
      type:ENVIRONMENT,
      typeId:546,
      scope:CONTAINER_REGISTRY,
      name:"MY_OWN_REGISTRY_PASSWORD",
      value:"MySecretPassword"}
  ) {
    id
  }
}
```

## Environment Files \(existing directly in the Git Repo\)

If you have environment variables that can safely be saved within a Git repository, we suggest adding them directly into the Git repository in an environment file. These variables will also be available within local development environments and are therefore more portable.

The syntax in the environment files is as following:

```bash title="myenvironment.env"
MYVARIABLENAME="MyVariableValue"
MVARIABLENUMBER=4242
DB_USER=$DB_USERNAME # Redefine DB_USER with the value of DB_USERNAME e.g. if your application expects another variable name for the Lagoon-provided variables.
```

### `.lagoon.env.$BRANCHNAME`

If you want to define environment variables different per environment you can create a `.lagoon.env.$BRANCHNAME` e.g. for the main branch `.lagoon.env.main`. This helps you keeping environment variables apart between environments.

### `.env` and `.env.defaults`

`.env` and `.env.defaults` will act as the default values for environment variables if none other is defined. For example, as default environment variables for pull request environments \(see [Workflows](workflows.md#pull-requests)\).

## Special Environment Variables

### `PHP_ERROR_REPORTING`

This variable, if set, will define the [logging](../logging/logging.md) level you would like PHP to use. If not supplied, it will be set dynamically based on whether this is a production or development environment.

On production environments, this value defaults to `E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE`.

On development environments, this value defaults to `E_ALL & ~E_DEPRECATED & ~E_STRICT`.

### Custom Backup Settings

Lagoon supports custom backup locations and credentials for any project when all four of the following variables are set as `BUILD` type variables. The environment variables need to be set at the project level (not per environment), and requires a Lagoon deployment after setting them (for every environment).

Please note that any use of these variables means that all environment and db backups created and managed by Lagoon will be stored using these credentials, meaning that any interruption of these credentials' may lead to failed or inaccessible backups.

| Environment variable name              | Purpose                                                                                                                                                               |
|:---------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT`   | Specify the S3 compatible endpoint where any Lagoon initiated backups should be stored. An example for S3 Sydney would be: `https://s3.ap-southeast-2.amazonaws.com`. |
| `LAGOON_BAAS_CUSTOM_BACKUP_BUCKET`     | Specify the bucket name where any Lagoon initiated backups should be stored.An example custom setting would be: `example-restore-bucket`.                             |
| `LAGOON_BAAS_CUSTOM_BACKUP_ACCESS_KEY` | Specify the access key Lagoon should use to access the custom backup bucket. An example custom setting would be: `AKIAIOSFODNN7EXAMPLE`.                              |
| `LAGOON_BAAS_CUSTOM_BACKUP_SECRET_KEY` | Specify the secret key Lagoon should use to access the custom backup bucket. An example custom setting would be: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.          |

No public access is needed on the S3 bucket and can be made entirely private.

Lagoon will automatically prune the files in these S3 buckets, so no object retention policy is needed at the bucket level.

### Custom Restore Location

Lagoon supports custom restore locations and credentials for any project when all four of the following variables are set as `BUILD` type environment variables. The environment variables need to be set at the project level (not per environment), and requires a Lagoon deployment after setting them (for every environment).

Please note that any use of these variables means that all environment and db snapshots restored by Lagoon will be stored using these credentials. This means that any interruption of these credentials' access may lead to failed or inaccessible restored files.

| Environment variable name               | Purpose                                                                                                                                                                |
|:----------------------------------------|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT`   | Specify the S3 compatible endpoint where any Lagoon initiated restores should be stored. An example for S3 Sydney would be: `https://s3.ap-southeast-2.amazonaws.com`. |
| `LAGOON_BAAS_CUSTOM_RESTORE_BUCKET`     | Specify the bucket name where any Lagoon initiated restores should be stored.An example custom setting would be: `example-restore-bucket`.                             |
| `LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY` | Specify the access key Lagoon should use to access the custom restore bucket. An example custom setting would be: `AKIAIOSFODNN7EXAMPLE`.                              |
| `LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY` | Specify the secret key Lagoon should use to access the custom restore bucket. An example custom setting would be: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`.          |

The S3 bucket must have public access enabled, as Lagoon will create [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) for the objects inside the bucket as needed.

An example AWS IAM policy that you can create to allow access to just the S3 bucket `example-restore-bucket` is:

```json title="aws_iam_restore_policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::example-restore-bucket"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation",
        "s3:PutObjectAcl"
      ],
      "Resource": [
         "arn:aws:s3:::example-restore-bucket/*"
      ]
    }
  ]
}
```

For increased security and reduced storage costs you can opt into [removing restored backups after a set lifetime](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html) (e.g. 7 days). Lagoon caters for this scenario gracefully and will re-create any restored snapshots as needed.
