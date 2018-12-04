# Step by Step: Setup a new Project in Lagoon

> **NOTE: We are working hard on getting a CLI and GraphQL API ready for everyone using Lagoon to setup and configure their projects themselves. We just need a little bit longer to test it before making the CLI and API publicly available.**

Until then the setup of a new project involves talking to your Lagoon Administrator. Anyway, they are anyway much friendlier than APIs ;)

Please have the following information ready for your Lagoon Administrator:

- SSH Public Keys, email addresses and the names of everybody that will work on this project
- The URL of the Git repository where your code is hosted (git@example.com:test/test.git)
- The name of the Git branch you would like to use for your production environment (see [Environment Types](./environment_types.md))
- Which Branches and Pull Requests you would like to deploy to your additional environments. With Lagoon you can filter Branches by their name with Regex, and Pull Requests by title again with Regex.

We suggest that you deploy specific important Branches (like `develop` and `master`) and Pull Requests. But that's all upto how you would like it. (see [Workflows](workflows.md))

## 1. Make sure your project is Lagoonized

We assume that your project is already lagoonized, this means that the `.lagoon.yml` and `docker-compose.yml` files are available in your Git repository and configured accordingly.

If this is not the case, check out the list of [Step-by-Step Guides](./index.md) on how to do so.

## 2. Provide access to your code

In order to deploy your Code, Lagoon needs access to it. By design and for security Lagoon only needs read access to your Git Repository.

Your Lagoon Administrator will tell you the SSH Public Key or the Git Account to give read access to.

## 3. Configure Webhook

Lagoon needs to be informed about a couple of events that are happening to your Git Repository. Currently these are Pushes and Pull Requests, but we may add more in the future.

As Lagoon supports many different Git hosts, we have split off those instructions into this documentation: [Configure Webhooks](./configure_webhooks.md)

## 4. Next: First deployment

Congratulations, you are now ready to run your [first deployment](./first_deployment.md).
