# Configure Webhooks

Your Lagoon administrator will also give you the route to the `webhook-handler`. You will add this to your repository as an outgoing webhook, and choose which events to send to Lagoon. Typically, you will send all push and pull request events. In Lagoon it is possible to add a regular expression to determine which branches and pull requests actually result in a deploy, and your Lagoon administrator can set that up for you. For example, all branches that start with `feature-` could be deployed to Lagoon.

{% hint style="info" %}
If you are an amazee.io customer, the route to the webhook-handler is: [`https://hooks.lagoon.amazeeio.cloud`](https://hooks.lagoon.amazeeio.cloud).
{% endhint %}

{% hint style="warning" %}
Managing the following settings will require you to have a high level of access to these repositories, which will be controlled by your organization. If you cannot access these settings, please contact your systems administrator or the appropriate person within your organization .
{% endhint %}

## GitHub

1.  Proceed to Settings -> Webhooks -> `Add webhook` in your GitHub repository.

    ![Adding webhook in GitHub.](<../.gitbook/assets/webhooks-2020-01-23-12-40-16 (1).png>)
2. The `Payload URL` is the route to the `webhook-handler` of your Lagoon instance, provided by your Lagoon administrator.
3.  Set `Content type` to `application/json`.

    ![Add the Payload URL and set the Content type.](<../.gitbook/assets/gh\_webhook\_1 (1).png>)
4. Choose "`Let me select individual events`."
5.  Choose which events will trigger your webhook. We suggest that you send `Push` and `Pull request` events, and then filter further in the Lagoon configuration of your project.

    ![Select the webhook event triggers in GitHub.](<../.gitbook/assets/gh\_webhook\_2 (1).png>)
6. Make sure the webhook is set to `Active`.
7. Click `Add webhook` to save your configuration.

## GitLab

1.  Navigate to Settings -> Integrations in your GitLab repository.

    ![Go to Settings \&gt; Integrations in your GitLab repository.](<../.gitbook/assets/gitlab-settings (4) (4) (5) (6) (4) (3) (1).png>)
2. The `URL` is the route to the `webhook-handler` of your Lagoon instance, provided by your Lagoon administrator.
3.  Select the `Trigger` events which will send a notification to Lagoon. We suggest that you send `Push events` and `Merge request events`, and then filter further in the Lagoon configuration of your project.

    ![Selecting Trigger events in GitLab.](<../.gitbook/assets/gitlab\_webhook (1).png>)
4. Click `Add webhook`to save your configuration.

## Bitbucket

1. Navigate to Settings -> Webhooks -> Add new webhook in your repository.
2. `Title` is for your reference.
3. `URL` is the route to the `webhook-handler` of your Lagoon instance, provided by your Lagoon administrator.
4. `Choose from a full list of triggers` and select the following:
   * Repository
     * Push
   *   Pull Request

       * Created
       * Updated
       * Approved
       * Approval removed
       * Merged
       * Declined

       ![Select the Bitbucket Triggers for your webhook.](<../.gitbook/assets/bb\_webhook\_1 (1).png>)
5. Click `Save` to save the webhook configurations for Bitbucket.
