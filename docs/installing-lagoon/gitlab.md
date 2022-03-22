# Gitlab

Not needed for \*most\* installs, but this is configured to integrate Lagoon with GitLab for user and group authentication.

1. [Create Personal Access token](https://docs.gitlab.com/ee/user/profile/personal\_access\_tokens.html) in GitLab for a User with Admin Access.
2. Create System Hooks under \`your-gitlab.com/admin/hooks\` pointing to: `webhookhandler.lagoon.example.com` and define a random secret token.
    1. Enable “repository update events”
3. Update `lagoon-core-values.yaml`:

		```yaml title="lagoon-core-values.yaml"
		api:
		additionalEnvs:
				GITLAB_API_HOST: <<URL of Gitlab example: https://your-gitlab.com>>
				GITLAB_API_TOKEN: << Personal Access token with Access to API >>
				GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
		webhooks2tasks:
		additionalEnvs:
				GITLAB_API_HOST: <<URL of Gitlab example: https://your-gitlab.com>>
				GITLAB_API_TOKEN: << Personal Access token with Access to API >>
				GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
		```

4. Update `lagoon-core helmchart`
5. If you've already created users in Keycloak, delete them.
6. Update `lagoon-core-values.yaml`

    ```yaml title="lagoon-core-values.yaml"
      yarn sync:gitlab:all
    ```
