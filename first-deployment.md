---
description: >-
  It's time! It's time for the first deployment into Lagoon! We hope you are as
  excited as we are!
---

# First Deployment

![excited](https://i.giphy.com/media/7kVRZwYRwF1ok/giphy-downsized.gif)

{% hint style="info" %}
 If you are deploying a Drupal Project, skip this and read the [Drupal specific First Deployment Documentation](drupal/first_deployment.md).
{% endhint %}

## 1. Make sure you are all set

In order to make your first deployment a successful one, please make sure that your project is Lagoonized and you have setup the project in Lagoon. If not, don't worry, go back and follow the [Step-by-Step Guides]() which show you how this works, and then come back and deploy!

## 2. Push!

With Lagoon you create a new deployment with just pushing into a branch that is configured to be deployed.

If you don't have any new code to push, don't worry, just run

```bash
git commit --allow-empty -m "go, go! Power Rangers!"
git push
```

This will trigger a push and the Git hosting will inform Lagoon about this push via the configured Webhook.

If all is correct you should see a notification in your configured chat system \(this has been configured by your friendly Lagoon Administrator\):

This is the information for you that Lagoon just started to deploy your code. Depending on the size of the code and amount of containers this will take a couple of seconds. Just relax. If you want to know what's happening now, check out the [Deployment & Build Process of Lagoon](build-and-deploy-process.md)

You can also check your Lagoon UI to see the progress of any deployment \(your Lagoon administrator has the info\).

## 3. It's done!

As soon as Lagoon is done building and deploying it will send a second notification to the chat system, here an example:

It tells you:

* Which project has been deployed
* Which branch and Git SHA has been deployed
* A link to the full Logs of the Build and Deployment
* Links to all Routes \(URLs\) where the environment can be reached at.

That's it! We hope that wasn't too hard - making devops accessible is what we are striving for.

## But wait, how about other branches or the production environment?

That's the beauty of Lagoon: it's exactly the same! Just push the branch name you defined to be your production branch and that one will be deployed.

## Failure? Don't worry.

Did the deployment fail? Oh no! But we're here to help:

1. If you deployed a Drupal site, make sure to read the [Drupal-specific First Deployment Documentation](drupal/first_deployment.md) which explains why this happens.
2. Click on the `Logs` link in the error notification, it will tell you where in the deployment process the failure happened.
3. If you can't figure it out, just ask your Lagoon Support, they are definitely here to help!

