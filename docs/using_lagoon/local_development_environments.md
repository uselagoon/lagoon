# Local Development Enviornments

Even though Lagoon has only a hard dependency on Docker and Docker Compose (which is mostly shipped with Docker) some things that are nice for local development are not included in Docker:

- a HTTP Reverse Proxy for nice URLs and HTTPs offloading
- DNS System so we don't have to remember IP Addresses
- SSH Agents to use SSH keys within Containers
- a system that receives and displays mails locally

Lagoon currently works best with `pygmy` which is the amazee.io flavored system of the above tools and works out of the box with Lagoon:

`pygmy` is a Ruby gem, so simply `gem install pygmy`. For detailed usage info on `pygmy`, see the [amazee.io docs](https://docs.amazee.io/local_docker_development/pygmy.html)

We are evaluating adding support for other systems like Lando, Docksal, DDEV, and Docker4Drupal, and will possibly add full support for these in the future. If you do have Lagoon running with a system like these, we would gladly love you to submit a [PR on Github](https://github.com/amazeeio/pygmy).
