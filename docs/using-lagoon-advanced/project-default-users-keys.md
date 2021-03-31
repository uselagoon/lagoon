# Project default users and SSH keys

When a Lagoon project is created, by default an associated SSH "project key" is generated and the private key made available inside the CLI pods of the project. A service account `default-user@project` is also created and given `MAINTAINER` access to the project. The SSH "project key" is attached to that `default-user@project`.

The upshot is that from inside the CLI pod of any environment it is possible to SSH to any other environment within the same project. This access is used for running tasks from the command line such as synchronising databases between environments (e.g. drush `sql-sync`).

There is more information on the `MAINTAINER` role available in the [RBAC](https://docs.lagoon.sh/lagoon/administering-lagoon/rbac) documentation.

## Specifying the project key

It is possible to specify an SSH private key when creating a project, but this is not recommended as it has security implications.
