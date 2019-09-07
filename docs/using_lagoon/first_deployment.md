# First Deployment

It's time! It's time for the first deployment into Lagoon! We hope you are as excited as we are!

![excited](https://i.giphy.com/media/7kVRZwYRwF1ok/giphy-downsized.gif)

Also a short Heads-Up: If you are deploying a Drupal Project we suggest to read the [Drupal specific First Deployment Documentation](./drupal/first_deployment.md).

## 1. Make sure you are all set

In order to make your first deployment a successful one, please make sure that your Project is Lagoonized and you have setup the Project in Lagoon. If not, don't worry, just follow the [Step-by-Step Guides](./index.md) which show you how this works.

## 2. Push!

With Lagoon you create a new deployment with just pushing into a branch that is configured to be deployed.

If you don't have any new code to push, don't worry, just run

    git commit --allow-empty -m "go, go! Power Rangers!"
    git push

This will trigger a push and the Git Hosting should inform Lagoon about this push via the configured Webhook.

If all is correct you should see a Notification in your configured Chat System:

![Deployment in Slack Start](/images/first_deployment_slack_start.jpg)

This is the information for you that Lagoon just started to deploy your code. Depending on the size of the code and amount of containers this will take a couple of seconds. Just relax. If you like to know whats happening now, check out the [Deployment & Build Process of Lagoon](./build_deploy_process.md)

## 3. It's done!

As soon as Lagoon is done building and deploying it will send a second notification to the chat system, here an example:

![Deployment in Slack Success](/images/first_deployment_slack_success.jpg)

It tells you:
- Which project has been deployed
- Which branch and Git sha has been deployed
- A link to the full Logs of the Build and Deployment
- Links to all Routes (URLs) where the environment can be reached at.

That's it! We hope that wasn't too hard.

## But wait, how about other branches or the production environment?

That's the beauty of Lagoon: It's exactly the same! Just push the branchname you defined to be your production branch and that one will be deployed.

## Failure? Don't worry.

Did the deployment fail? Oh no! But we're here to help:

1. If you deployed a Drupal site, probably best read the [Drupal specific First Deployment Documentation](./drupal/first_deployment.md) which explains why this happens.
2. Click on the `Logs` Link in the Error Notification, it will tell you where in the Deployment Process the failure happened.
3. If you can't figure it out, just ask your Lagoon Support, they are definitely here to help!
