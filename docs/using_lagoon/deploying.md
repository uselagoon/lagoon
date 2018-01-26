# Deploying Lagoon Projects

## `.lagoon.yml`

## Repository Configuration
To allow Lagoon to deploy your project there are a few things which need configuring on the repository itself. Namely, an SSH key which Lagoon will use to authenticate, and a webhook which will send event notifications.
### Basics

### SSH Deploy Key
When a project is added to Lagoon a private key is added. Lagoon will use this key to authenticate to your git provider. Ask your Lagoon administrator for the public half of this key, and add it to a user which has at minimum READ access to your repository. Because of how Lagoon works, publicly available repos will also need this in place.
### Webhook
From your Lagoon administrator, you will also need the route to the webhook-handler. You will add this to your repository as an outgoing webhook, and choose which events to send to Lagoon. Typically you will send all Push and Pull Request \ Merge Request events. In Lagoon it is possible to add a regex to determine which events actually result in a deploy.

### Common Repository Setup
Here are instructions for setting up Lagoon on common git hosting solutions.
#### Github
 1. Proceed to Settings -> Webhooks -> `Add webhook` in your repo
 2. The `Payload URL` is the route to the webhook-handler of your Lagoon instance
 3. Set `Content type` to `application\json`
 ![Github Webhook Configuration 1](/images/gh_webhook_1.png)
 4. Choose which events will trigger your webhook. It is our suggestion that you send `push` and `Pull request` events, and then filter further in the Lagoon configuration of your project.
 5. `Add webhook`
   ![Github Webhook Configuration 2](/images/gh_webhook_2.png)
#### GitLab
#### BitBucket
