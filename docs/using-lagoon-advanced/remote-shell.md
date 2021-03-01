# Remote Shell

Lagoon allows you to connect to your running containers via SSH. The containers themselves don't actually have an SSH server installed, but instead you connect via SSH to Lagoon, which then itself creates a remote shell connection via the Kubernetes API for you.

## Endpoint

Ask your Lagoon administrator for the Lagoon SSH host and port. For amazee.io, this `ssh.lagoon.amazeeio.cloud` and `32222`.

## Authentication

As you connect via SSH, the authentication also happens automatically via SSH public & private key authentication \(passwordless FTW!\)

## Connection

Connecting is straightforward and follows the following pattern:

```bash
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST]
```

* `PORT` - The remote shell SSH endpoint port \(for amazee.io: `32222`\).
* `HOST` - The remote shell SSH endpoint host \(for amazee.io `ssh.lagoon.amazeeio.cloud`\).
* `PROJECT-ENVIRONMENT-NAME` - The environment you want to connect to. This is most commonly in the pattern `PROJECTNAME-ENVIRONMENT`.

As an example:

```bash
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud
```

This will connect you to the project `drupal-example` on the environment `master`.

## Pod/Service, Container Definition

By default, the remote shell will try to connect you to the container defined with the type `cli`. If you like to connect to another pod/service you can define it via:

```bash
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] service=[SERVICE-NAME]
```

If your pod/service contains multiple containers, Lagoon will connect you to the first defined container. Or you can define the specific container via:

```bash
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] service=[SERVICE-NAME] container=[CONTAINER-NAME]
```

As example to connect to the `php` container within the `nginx` pod:

```bash
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud service=nginx container=php
```

## Execute Commands

Like with regular SSH, you can also execute a remote command directly without opening an actual shell.

Example:

```bash
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud whoami
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud service=nginx whoami
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud service=nginx container=php whoami
```

This will execute `whoami` within the `cli` container.

## Multiple SSH Keys

If you have multiple SSH keys, you can specify which key to use for a given domain by setting this in your `~/.ssh/config` file.

~/.ssh/.config
```
Host *
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/[YOUR-DEFAULT-PRIVATE-KEY]
Host ssh.lagoon.amazeeio.cloud
  IdentityFile ~/.ssh/[YOUR-PRIVATE-KEY-FOR-USE-ON-LAGOON]
```
