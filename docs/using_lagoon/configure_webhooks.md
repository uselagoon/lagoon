# Configure Webhooks
From your Lagoon administrator, you will also need the route to the
webhook-handler. You will add this to your repository as an outgoing webhook,
and choose which events to send to Lagoon. Typically you will send all Push and
Pull Request \ Merge Request events. In Lagoon it is possible to add a regex to
determine which branches and pull requests actually result in a deploy.

If you are an amazee.io customer, the webhook url is:
`https://hooks.lagoon.amazeeio.cloud`.

## Github

1. Proceed to Settings -> Webhooks -> `Add webhook` in your repository
2. The `Payload URL` is the route to the webhook-handler of your Lagoon instance
3. Set `Content type` to `application\json`
![Github Webhook Configuration 1](/images/gh_webhook_1.png)
4. Choose which events will trigger your webhook. It is our suggestion that you send `push` and `Pull request` events, and then filter further in the Lagoon configuration of your project.
![Github Webhook Configuration 2](/images/gh_webhook_2.png)
5. `Add webhook`

## GitLab

1. Navigate to Settings -> Integrations for your repository
2. The `URL` is the route to the webhook-handler of your Lagoon instance
3. Set the `Trigger` for which events will send a notification to Lagoon. It is our suggestion that you send `Push events` and `Merge request events` events, and then filter further in the Lagoon configuration of your project.
![Gitlab Webhook Setup](/images/gl_webhook_1.png)
4. `Add webhook`

## BitBucket

1. Navigate to Settings -> Webhooks -> Add new webhook in your repository
2. `Title` is for your reference, `URL`  is the route to the webhook-handler of your Lagoon instance
3. `Choose from a full list of triggers` and select
  * Repository
    * push
  * Pull Request
    * Created
    * Updated
    * Approved
    * Approval Removed
    * Merged
    * Declined
![Bitbucket Webhook Setup](/images/bb_webhook_1.png)
4. `Save`