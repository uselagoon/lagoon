# Linux & OS X pygmy
  - Prerequisites
  - Installation
  - Start
  - Help
    - Command line usage
  - Adding ssh keys
  - Checking the status
  - `pygmy down` vs `pygmy stop`
  - Update Docker Containers with pygmy
    - Update pygmy

pygmy is the single tool needed to get the amazee.io Docker Drupal Development Environment running on your Linux based system. It is also capable of working together with the very new [Docker for Mac](https://docs.docker.com/docker-for-mac/)! (quite a lot for such a [small whale](https://en.wikipedia.org/wiki/Pygmy_sperm_whale) 🐳)

> You do need to be running at least Docker for Mac version 17 to run `pygmy`. If for some reason you cannot do this, a Docker Machine based tool, `cachalot` is available for you.

`pygmy` will handle for you:

  - Starting the necessary Docker Containers for the amazee.io Drupal Docker Development
  - If on Linux: Adds `nameserver 127.0.0.1` to your `/etc/resolv.conf` file, so that your local Linux can resolve `*.docker.amazee.io` via the dnsmasq container
  - If on Mac with Docker for Mac: Creates the file `/etc/resolver/docker.amazee.io` which tells OS X to forward DNS requests for `*.docker.amazee.io` to the dnsmasq container
  - Tries to add the ssh key in `~/.ssh/id_rsa` to the ssh-agent container (no worries if that is the wrong key, you can add more any time)

## Installation of Pygmy

### Prerequisites

Make sure you have the following dependencies installed:

1. Docker (Version >= 1.11.1), see [the official guides](https://docs.docker.com/engine/installation/) how to do that
2. Ruby, see [the official guides](https://www.ruby-lang.org/en/documentation/installation/)
3. If you are on Ubuntu, disable the DNS that is started by default, see: [http://askubuntu.com/a/233223](http://askubuntu.com/a/233223)

### Installation

The installation of `pygmy` is fairly simple and can be accomplished via the ruby gem package manager

```
gem install pygmy
```

### Start

To start `pygmy` run following command

```
pygmy up
```

`pygmy` will now start all the required Docker containers and add the ssh key.

**All done?** Head over to [Drupal Docker Containers](https://docs.amazee.io/local_docker_development/drupal_site_containers.html) to learn how to work with docker containers.

## Help

See Help for `pygmy`

## Command line usage

```
pygmy help

Commands:
  pygmy addkey [~/.ssh/id_rsa]  # Add additional ssh-key
  pygmy down                    # Stop and destroy all pygmy services
  pygmy help [COMMAND]          # Describe available commands or one specific command
  pygmy restart                 # Stop and restart all pygmy services
  pygmy status                  # Report status of the pygmy services
  pygmy stop                    # Stop all pygmy services
  pygmy up                      # Bring up pygmy services (dnsmasq, resolv, ssh-agent)
  pygmy version                 # Check current installed version of pygmy
```

## Adding ssh keys

Call the addkey command with the absolute path to the key you would like to add. In case this they is passphrase protected, it will ask for your passphrase.

```
pygmy addkey /Users/amazeeio/.ssh/my_other_key

Enter passphrase for /Users/amazeeio/.ssh/my_other_ke:
Identity added: /Users/amazeeio/.ssh/my_other_key (/Users/amazeeio/.ssh/my_other_key)
```

## Checking the status

Run `pygmy status` and `pygmy` will tell you how it feels right now and which ssh-keys it currently has in it's stomach:

```
pygmy status

[*] Dnsmasq: Running as docker container amazeeio-dnsmasq
[*] Haproxy: Running as docker container amazeeio-haproxy
[*] Resolv is properly configured
[*] ssh-agent: Running as docker container amazeeio-ssh-agent, loaded keys:
4096 SHA256:QWzGNs1r2dfdfX2PHdPi5sdMxdsuddUbPSi7HsrRAwG43sHI /Users/amazeeio/.ssh/my_other_key (RSA)
```

## `pygmy down` vs `pygmy stop`

`pygmy` behaves like Docker, it's a whale in the end!
During regular development `pygmy stop` is perfectly fine, it will keep the Docker containers still alive, just in stopped state. If you like to cleanup though, use pygmy down to really remove the Docker containers.
Update Docker Containers with pygmy

pygmy can update shared docker containers for you:

```
pygmy update
```

After it updated all containers, it will recreate them as well.

## Update `pygmy`

`pygmy` gets new releases sometimes and who doesn't like them, so much excitement for new functionality!

As rubygems does not remove old versions of gems when updating, you should remove old version after a new version has been installed.

First update:

```
gem update pygmy

Updating installed gems
Updating pygmy
Successfully installed pygmy-0.9.4
Parsing documentation for pygmy-0.9.4
Installing ri documentation for pygmy-0.9.4
Installing darkfish documentation for pygmy-0.9.4
Done installing documentation for pygmy after 0 seconds
Parsing documentation for pygmy-0.9.4
Done installing documentation for pygmy after 0 seconds
Gems updated: pygmy
```

A new version!

Now uninstall the old one:

```
gem uninstall pygmy

Select gem to uninstall:
 1. pygmy-0.9.3
 2. pygmy-0.9.4
 3. All versions
> 1
Successfully uninstalled pygmy-0.9.3
```

check the correct version:

```
pygmy -v

Pygmy - Version: 0.9.4
```
