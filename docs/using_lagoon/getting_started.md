# Getting Started

## System Requirements

### Docker
 To run Lagoon Project your system must meet the requirements to run Docker. We suggest installing the latest version of Docker for your workstation. You can download Docker [here](https://www.docker.com/get-docker). We also suggest allowing Docker at least 4 CPUs and 4GB RAM.

### `pygmy`
Currently it is simplest to run Lagoon projects via the amazee.io [pygmy](https://github.com/amazeeio/pygmy) tool. We are evaluating adding support for other systems like Lando, Docksal, and Docker4Drupal, and will possibly add full support for these in the future. If you do have Lagoon running with a system like these, we would gladly love you to submit a PR.

`pygmy` is a Ruby gem, so simply `gem install pygmy`. For detailed usage info on `pygmy`, see the [amazee.io docs](https://docs.amazee.io/local_docker_development/pygmy.html)

## Preparing the site

### Drupal Settings Files
The containers of Lagoon provide all the configuration variables that Drupal requires via environment variables. We have provided a set of example Drupal settings files for you to use [here](https://github.com/amazeeio/drupal-setting-files/tree/lagoon). Copy these into your site. Don't forget to make sure you `.gitignore` will allow you to commit the settings files.

### Docker Configuration

#### `docker-compose.yml`

#### Dockerfiles
