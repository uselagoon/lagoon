# GitLab

Not needed for \*most\* installs, but this is configured to integrate Lagoon with GitLab for user and group authentication.

1. [Create Personal Access token](https://docs.gitlab.com/ee/user/profile/personal\_access\_tokens.html) in GitLab for a user with admin access.
2. Create system hooks under `your-gitlab.com/admin/hooks` pointing to: `webhookhandler.lagoon.example.com` and define a random secret token.
   1. Enable “repository update events”
3. Update `lagoon-core-values.yml`:

    ```yaml title="lagoon-core-values.yml"
    api:
      additionalEnvs:
        GITLAB_API_HOST: <<URL of GitLab example: https://your-gitlab.com>>
        GITLAB_API_TOKEN: << Personal Access token with Access to API >>
        GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
    webhook-haondler:
      additionalEnvs:
        GITLAB_API_HOST: <<URL of GitLab example: https://your-gitlab.com>>
        GITLAB_API_TOKEN: << Personal Access token with Access to API >>
        GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
    webhooks2tasks:
      additionalEnvs:
        GITLAB_API_HOST: <<URL of GitLab example: https://your-gitlab.com>>
        GITLAB_API_TOKEN: << Personal Access token with Access to API >>
        GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
    ```

4. Helm update the `lagoon-core` helmchart.
5. If you've already created users in Keycloak, delete them.
6. Run the following command in an API pod:

    ```bash title="Sync with GitLab"
      yarn sync:gitlab:all
    ```
