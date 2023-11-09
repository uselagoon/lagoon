# Set Up a New Project

!!! Note
    We are working hard on getting our CLI and GraphQL API set up to allow everyone using Lagoon to set up and configure their projects themselves. Right now, it needs more testing before we can release those features, so hold tight!

Until then, the setup of a new project involves talking to your Lagoon administrator, which is ok, as they are much friendlier than APIs. 😊

Please have the following information ready for your Lagoon administrator:

* A name you would like the project to be known by
  * This name can only contain lowercase characters, numbers and dashes
  * Double dashes (`--`) are not allowed within a project name
* SSH public keys, email addresses and the names of everybody that will work on this project. Here are instructions for generating and copying SSH keys for [GitHub](https://help.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh), [GitLab](https://docs.gitlab.com/ee/ssh/), and [Bitbucket](https://confluence.atlassian.com/bitbucket/set-up-an-ssh-key-728138079.html).
* The URL of the Git repository where your code is hosted \(`git@example.com:test/test.git`\).
* The name of the Git branch you would like to use for your production environment \(see [Environment Types](../concepts-advanced/environment-types.md) for details about the environments\).
* Which branches and pull requests you would like to deploy to your additional environments. With Lagoon, you can filter branches and pull requests by name with regular expressions, and your Lagoon administrator can get this set up for you.

We suggest deploying specific important branches \(like `develop` and `main`\) and pull requests. But that's all up to you! \(see [Workflows](../concepts-advanced/workflows.md) for some more information\)

## 1. Make sure your project is Lagoonized

This means that the `.lagoon.yml` and `docker-compose.yml` files are available in your Git repository and configured accordingly.

If this is not the case, check out the list of [Step-by-Step Guides](index.md#step-by-step-guides) on how to do so before proceeding.

## 2. Provide access to your code

In order to deploy your code, Lagoon needs access to it. By design and for security, Lagoon only needs read access to your Git repository.

Your Lagoon administrator will tell you the SSH public key or the Git account to give read access to.

## 3. Configure Webhooks

Lagoon needs to be informed about a couple of events that are happening to your Git repository. Currently these are pushes and pull requests, but we may add more in the future.

As Lagoon supports many different Git hosts, we have split off those instructions into this documentation: [Configure Webhooks](configure-webhooks.md).

## 4. Next: First deployment

Congratulations, you are now ready to run your [first deployment](first-deployment.md).
