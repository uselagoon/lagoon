# Local Development Environments

Even though Lagoon has only a hard dependency on Docker and [Docker Compose](https://docs.docker.com/compose/) \(which is mostly shipped with Docker\) there are some things which are nice for local development that are not included in Docker:

* An HTTP reverse proxy for nice URLs and HTTPS offloading.
* A DNS system so we don't have to remember IP addresses.
* SSH agents to use SSH keys within containers.
* A system that receives and displays mail locally.

???+ warning
    You do not need to _install_ Lagoon locally to _use_ it locally! That sounds confusing but follow the documentation. Lagoon is the system that **deploys** your local development environment to your production environment, it's **not** the environment itself.

## pygmy, DDEV, or Lando - the choice is yours

### pygmy

Lagoon has traditionally worked best with `pygmy` , which is a preconfigured system of the above tools and works out of the box with Lagoon. It lives at [https://github.com/pygmystack/pygmy](https://github.com/pygmystack/pygmy)

`pygmy` is written in Golang, so to install it, run:

```bash title="Install with HomeBrew"
brew tap pygmystack/pygmy && brew install pygmy
```

For detailed usage or installation info on pygmy, see its [documentation](https://pygmy.readthedocs.io/en/master/).

### Lando

Lagoon is well-integrated with Lando! For more information, please see the documentation at [https://docs.lando.dev/config/lagoon.html](https://docs.lando.dev/config/lagoon.html) to get yourself up and running.

Lando's workflow for Lagoon will be familiar to users of Lando, and will also be the easiest way for Lagoon newcomers to get up and running. Pygmy presents a closer integration with Docker, which will lend itself better to more complex scenarios and use cases but will also require a deeper understanding.

### DDEV

Lagoon is also supported on DDEV! Check out their documentation to get started: [https://ddev.readthedocs.io/en/stable/users/providers/lagoon/](https://ddev.readthedocs.io/en/stable/users/providers/lagoon/).

We have previously evaluated adding support for other systems like [Docksal](https://docksal.io/) and [Docker4Drupal](https://wodby.com/docs/stacks/drupal/local/), and while we may add support for these in the future, our current focus is on supporting our current tools.
