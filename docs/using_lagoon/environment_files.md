#Environment Files

It is common to store API Tokens or credentials for applications in environment variables.
Following best practices those credentials are different per environment. We allow each environment to use a separate
set of environment variables defined in Environment Files

# `.env` and `.env.defaults`
`.env` and `.env.defaults` will act as the default values for environment variables if none other is defined. For example
as default environment variables for Pull-Request environments (see [Worfklows](./workflows.md#pull-requests)).

# `.lagoon.env.$BRANCHNAME`
If you want to define environment variables different per environment you can create a `.lagoon.env.$BRANCHNAME` e.g. for the master branch `.lagoon.env.master`. This helps you keeping environment variables apart between environments.

## Hierarchy of Environment Variables
We use a docker entrypoint ([50-dotenv.sh in the common image](https://github.com/amazeeio/lagoon/blob/master/images/commons/lagoon/entrypoints/50-dotenv.sh)) to read the environment files.


As there can already be environment variables defined in either the Dockerfile of during runtime (via docker run), we have an hierarchy of Environment variables: Environment variables defined in lower numbers are stronger

1. Runtime environment variables (docker run)
2. environment variables defined in Dockerfile (ENV)
3. Env variables defined in `.lagoon.env.$BRANCHNAME` (if file exists and where $BRANCHNAME is the Branch this Dockerimage has been uilt for), use this for overwriting variables for only specific branches
4. Environment variables defined in `.env`
5. Environment variables defined in `.env.defaults`
