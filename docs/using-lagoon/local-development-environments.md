# Local Development Environments

Even though Lagoon has only a hard dependency on Docker and [Docker Compose](https://docs.docker.com/compose/) \(which is mostly shipped with Docker\) there are some things which are nice for local development that are not included in Docker:

* a HTTP Reverse Proxy for nice URLs and HTTPs offloading
* DNS System so we don't have to remember IP Addresses
* SSH Agents to use SSH keys within Containers
* a system that receives and displays mail locally

{% hint style="warning" %}
You do not need to _install_ Lagoon locally in order to _use_ it locally! That sounds confusing, but follow the documentation. Lagoon is the system that deploys your local development environment to your production environment, it's **not** the environment itself. 
{% endhint %}

Lagoon currently works best with `pygmy` which is the amazee.io flavored system of the above tools and works out of the box with Lagoon.

`pygmy` is a [Ruby](https://www.ruby-lang.org/en/) gem, so to install it, run: `gem install pygmy`.

For detailed usage info on `pygmy`, see the [documentation of pygmy](https://pygmy.readthedocs.io/)

We are evaluating adding support for other systems like [Lando](https://lando.dev/), [Docksal](https://docksal.io/), [DDEV](https://www.ddev.com/ddev-local/), and [Docker4Drupal](https://wodby.com/docs/stacks/drupal/local/), and will possibly add full support for these in the future. If you do have Lagoon running with a system like these, we would love for you to submit a [PR on GitHub](https://github.com/amazeeio/pygmy).

