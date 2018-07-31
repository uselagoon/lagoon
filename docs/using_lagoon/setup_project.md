# Step by Step: Setup a new Project in Lagoon

**NOTE: We are working hard on having a CLI and GraphQL API ready for everybody to setup and configure their projects themselves. It needs a couple of more days testing.**
Until then the setup of a new project involves talking to your Lagoon Administrator. They are anyway much friendlier then APIs ;)

Please have the following information ready for your Lagoon Administrator:

- SSH-Public Keys of everybody that will work on this project
- The URL of the Git repository which will host the code (git@example.com:test/test.git)
- The Git branch you would like to use as your production environment (see [Environment Types](./environment_types.md))
- Which Branches and Pull Requests you would like to deploy. Lagoon allows to filter Branches by their name with Regex, and Pull Requests by title again with Regex.

Our suggestion is to deploy specific important Branches (like `develop` and `master`) and Pull Requests. But it's all your choice!

## 1. Make sure your project is Lagoonized

We are assuming that your project is already lagoonized, aka that the `.lagoon.yml` and `docker-compose.yml` files are available in your Git Repo and configured accordingly.

If this is not the case, check out the list of [Step-by-Step Guides](./index.md) on how to do so.

## 2. Provide access to your code

In order to deploy your Code, Lagoon needs access to it. By design and for security Lagoon only needs read access to your Git Repository.

Your Lagoon Administrator will tell you the SSH Public Key or the Git Account to give read access to.

## 3. Configure Webhook

Lagoon needs to be informed about a couple of events that are happening to your Git Repository. Currently these are Pushes and Pull Requests, but maybe more might follow in the future.

As Lagoon supports many different Git Hostings, this part is on it's individual documentation: [Configure Webhooks](./configure_webhooks.md)

## 4. Next: First deployment

That's it, now you are ready to run your [first deployment](./first_deployment.md).
