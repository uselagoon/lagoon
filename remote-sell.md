# Remote Shell

Lagoon allows you to connect into your running containers via SSH. The containers themselves actually don't have SSH Server installed, instead you connect via SSH to a Lagoon Service, which then itself creates a remote shell connection via the Kubernetes API for you.

## Endpoint

Ask your Lagoon Administrator for the Lagoon SSH host and port. For amazee.io this `ssh.lagoon.amazeeio.cloud` and `32222`.

## Authentication

As you connect via SSH, the Authentication also happens automatically via SSH public & private key Authentication \(passwordless FTW!\)

## Connection

Connecting is straightforward and follows the following pattern:

```bash
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST]
```

* `PORT` - The Remote Shell SSH Endpoint Port \(for amazee.io `32222`\)
* `HOST` - The Remote Shell SSH Endpoint Host \(for amazee.io `ssh.lagoon.amazeeio.cloud`\)
* `PROJECT-ENVIRONMENT-NAME` - the environment you like to connect too, this is most commonly in the pattern `PROJECTNAME-ENVIRONMENT`

As en example:

```bash
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud
```

Will connect you to the Project `drupal-example` on the environment `master`.

## Pod/Service, Container Definition

By default the remote shell will try to connect you to the container defined with the type `cli`. If you like to connect to another pod/service you can define it via

```bash
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] service=[SERVICE-NAME]
```

If your Pod/Service contains multiple containers, Lagoon will connect you to the first defined container. Or you can define the specific container via

```bash
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] service=[SERVICE-NAME] container=[CONTAINER-NAME]
```

As example to connect to the `php` container within the `nginx` pod:

```bash
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud service=nginx container=php
```

## Execute Commands

Like with regular SSH you can also execute a remote command directly without opening an actual shell.

Example:

```bash
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud whoami
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud service=nginx whoami
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud service=nginx container=php whoami
```

Will execute `whoami` within the `cli` container.

