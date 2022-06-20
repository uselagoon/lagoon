# Contributing

We gladly welcome any and all contributions to Lagoon!

## What kind of contributions do we need?

Lagoon benefits from any kind of contribution - whether it's a bugfix, new feature, documentation update, or simply some queue maintenance - we're happy that you want to help

### Developing for Lagoon

There's a whole section on how to get Lagoon running on your local machine using KinD over at [Developing Lagoon](contributing-to-lagoon/developing-lagoon.md).  This documentation is still very WIP - but there are a lot of Makefile routines to help you out.

### Installing Lagoon

We've got another section that outlines how to install Lagoon from Helm charts at [Installing Lagoon Into Existing Kubernetes Cluster](installing-lagoon/requirements.md) - we'd love to get this process as slick as possible!

### Help us with our examples

Right now one of our biggest needs is putting together examples of Lagoon working with various content management systems, etc, other than Drupal.

If you can spin up an open source CMS or framework that we don’t currently have as a docker-compose stack, send us a PR. Look at the existing examples at [https://github.com/uselagoon/lagoon-examples](https://github.com/uselagoon/lagoon-examples) for tips, pointers and starter issues.

One small catch – wherever possible, we’d like them to be built using our base Docker hub images [https://hub.docker.com/u/uselagoon](https://hub.docker.com/u/uselagoon) – if we don’t have a suitable image, or our images need modifying – throw us a PR \(if you can\) or create an issue \(so someone else can\) at [https://github.com/uselagoon/lagoon-images](https://github.com/uselagoon/lagoon-images).

Help us improve our existing examples, if you can - are we following best practices, is there something we’re doing that doesn’t make sense?

Bonus points for anyone that helps contribute to tests for any of these examples – we’ve got some example tests in a couple of the projects you can use for guidance – [https://github.com/amazeeio/drupal-example-simple/blob/8.x/TESTING\_dockercompose.md](https://github.com/amazeeio/drupal-example-simple/blob/8.x/TESTING_dockercompose.md). The testing framework we’re using is [Leia](https://github.com/lando/leia), from the excellent team behind [Lando](https://lando.dev/).

Help us to document our other examples better – we’re not expecting a full manuscript, but tidy-ups, links to helpful resources and clarifying statements are all super-awesome.

If you have any questions, reach out to us on [Discord](https://discord.gg/te5hHe95JE)!

## I found a security issue 🔓

We take security very seriously. If you discover a security issue or think you found one, please bring it to the maintainers' attention.

!!! Danger "Danger:"
    Please send your findings to [security@amazee.io](mailto:security@amazee.io). Please **DO NOT** file a GitHub issue for them.

Security reports are greatly appreciated and will receive public karma and swag! We're also working on a Bug Bounty system.

## I found an issue

We're always interested in fixing issues, therefore issue reports are very welcome. Please make sure to check that your issue does not already exist in the [issue queue](https://github.com/uselagoon/lagoon/issues).

## I have a feature request or idea

Cool! Create an [issue](https://github.com/uselagoon/lagoon/issues) and we're happy to look over it. We can't guarantee that it will be implemented. But we are always interested in hearing ideas of what we could bring to Lagoon.

Another good way is also to talk to us via RocketChat about your idea. [Join today](https://amazeeio.rocket.chat/) in the channel \#lagoon.

## I wrote some code

Epic! Please send us a pull request for it, we will do our best to review it and merge it if possible.
