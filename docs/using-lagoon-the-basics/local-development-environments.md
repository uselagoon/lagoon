# Local Development Environments

Even though Lagoon has only a hard dependency on Docker and [Docker Compose](https://docs.docker.com/compose/) \(which is mostly shipped with Docker\) there are some things which are nice for local development that are not included in Docker:

* An HTTP reverse proxy for nice URLs and HTTPS offloading.
* A DNS system so we don't have to remember IP addresses.
* SSH agents to use SSH keys within containers.
* A system that receives and displays mail locally.

!!! warning "Warning:"
    You do not need to _install_ Lagoon locally to _use_ it locally! That sounds confusing but follow the documentation. Lagoon is the system that **deploys** your local development environment to your production environment, it's **not** the environment itself.

## pygmy or Lando - the choice is yours

Lagoon has traditionally worked best with `pygmy` , which is the amazee.io flavored system of the above tools and works out of the box with Lagoon. It lives at [https://github.com/amazeeio/pygmy](https://github.com/amazeeio/pygmy)

`pygmy` is a [Ruby](https://www.ruby-lang.org/en/) gem, so to install it, run: `gem install pygmy`. For detailed usage info on pygmy, see its [documentation](https://pygmy.readthedocs.io/en/master/).

As announced in our [blog post](https://www.amazee.io/blog/post/announcing-lando-integration-for-lagoon), Lagoon is now also compatible with Lando! For more information, please see the documentation at [https://docs.lando.dev/config/lagoon.html](https://docs.lando.dev/config/lagoon.html) to get yourself up and running.

Lando's workflow for Lagoon will be familiar to users of Lando, and will also be the easiest way for Lagoon newcomers to get up and running. Pygmy presents a closer integration with Docker, which will lend itself better to more complex scenarios and use cases but will also require a deeper understanding.

There is also a community-built fork of Pygmy, re-written in Go, available at [https://github.com/fubarhouse/pygmy-go](https://github.com/fubarhouse/pygmy-go) that presents even more opportunity for local customization and control.

We have previously evaluated adding support for other systems like [Docksal](https://docksal.io/) and [Docker4Drupal](https://wodby.com/docs/stacks/drupal/local/), and while we may add support for these in the future, our current focus is on supporting using Lando and pygmy. If you do have Lagoon running with one of these \(or other\) tools, we would love for you to submit a [PR on GitHub](https://github.com/amazeeio/pygmy)!

