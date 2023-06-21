---
description: >-
  It's time! It's time for the first deployment into Lagoon! We hope you are as
  excited as we are!
---

# First Deployment

![excited](https://i.giphy.com/media/7kVRZwYRwF1ok/giphy-downsized.gif)

!!! Note
    If you are deploying a Drupal Project, skip this and read the [Drupal-specific first deployment documentation](../drupal/first-deployment-of-drupal.md).

## 1. Make sure you are ready

In order to make your first deployment a successful one, please make sure that your project is Lagoonized and that you have set up the project in Lagoon. If not, or you're not sure, or that doesn't sound familiar, don't worry, go back and follow the [Step-by-Step Guides](setup-project.md) which show you how this works, and then come back and deploy!

## 2. Push

With Lagoon, you create a new deployment by pushing into a branch that is configured to be deployed.

If you don't have any new code to push, don't worry! Run:

```bash title="Git push"
git commit --allow-empty -m "go, go! Power Rangers!"
git push
```

This will trigger a push, and your Git hosting will inform Lagoon about this push via the configured webhook.

If all is correct, you should see a notification in your configured chat system \(this has been configured by your friendly Lagoon administrator\):

![Slack notification that a push has been made in a Lagoonized repository.](./first_deployment_slack_start.jpg)

This informs you that Lagoon has just started to deploy your code. Depending on the size of the code and amount of containers, this will take a couple of seconds. Just relax. If you want to know what's happening now, check out the [Build and Deploy Process of Lagoon](build-and-deploy-process.md).

You can also check your Lagoon UI to see the progress of any deployment \(your Lagoon administrator has the info\).

## 3. It's done

As soon as Lagoon is done building and deploying it will send a second notification to the chat system, here an example:

![Slack notification of a successful Lagoon build and deployment.](./first_deployment_slack_2nd_success.jpg)

It tells you:

* Which project has been deployed.
* Which branch and Git SHA have been deployed.
* A link to the full logs of the build and deployment.
* Links to all routes \(URLs\) where the environment can be reached.

You can also quickly tell what kind of notification it is by the emoji at the beginning - whether it's just info that the build has started, a success, or fail.

That's it! We hope that wasn't too hard - making devOps accessible is what we are striving for!

## But wait, how about other branches or the production environment?

That's the beauty of Lagoon: it's exactly the same! Just push the name of the branch and that one will be deployed.

## Failure? Don't worry

Did the deployment fail? Oh no! But we're here to help:

1. If you deployed a Drupal site, make sure to read the [Drupal-specific first deployment documentation](../drupal/first-deployment-of-drupal.md), which explains why this happens.
2. Click on the `Logs` link in the error notification, it will tell you where in the deployment process the failure happened.
3. If you can't figure it out, just ask your Lagoon support, we are here to help!
4. Reach out to us in your support channel or in [the community Discord](https://discord.gg/te5hHe95JE).
