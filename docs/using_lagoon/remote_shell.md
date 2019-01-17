# Remote Shell

Lagoon allows you to connect into your running containers via SSH. The containers itself actually don't have any SSH Server installed, instead you connect via SSH to a Lagoon Service which then itself creates a remote shell connection via the Kubernetes API for you.

### Endpoint

Ask your Lagoon Administrator for the Lagoon SSH Host and Port. For amazee.io this `ssh.lagoon.amazeeio.cloud` and `32222`.

### Authentication

As you connect via SSH, the Authentication also happens automatically via SSH Public & Private Key Authentication (passwordless FTW!)

### Connection

Connecting is easy and follows the following pattern:

```
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] rsh
```

- `PORT` - The Remote Shell SSH Endpoint Port (for amazee.io `32222`)
- `HOST` - The Remote Shell SSH Endpoint Host (for amazee.io `ssh.lagoon.amazeeio.cloud`)
- `PROJECT-ENVIRONMENT-NAME` - the environment you like to connect too, this is most commonly in the pattern `PROJECTNAME-ENVIRONMENT`

As en example:

```
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud rsh
```

Will connect you to the Project `drupal-example` on the environment `master`.

### Pod/Service, Container Definition

By default the remote shell will try to connect you to the container defined with the type `cli`. If you like to connect to another pod/service you can define it via

```
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] rsh service=[SERVICE-NAME]
```

If your Pod/Service contains multiple containers, Lagoon will connect you to the first defined container. Or you can define the specific container via

```
ssh -p [PORT] -t [PROJECT-ENVIRONMENT-NAME]@[HOST] rsh service=[SERVICE-NAME] container=[CONTAINER-NAME]
```

As example to connect to the `php` container within the `nginx` pod:

```
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud rsh service=nginx container=php
```

### Execute Commands

Like with regular SSH you can also execute a remote command directly without opening an actual shell.

Example:

```
ssh -p 32222 -t drupal-example-master@ssh.lagoon.amazeeio.cloud rsh whoami
```

Will execute `whoami` within the `cli` container.
