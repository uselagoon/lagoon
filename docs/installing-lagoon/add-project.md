# Adding a Project

## Add the project to Lagoon

1. Run this command:
    ```bash
    lagoon add project \
      --gitUrl <YOUR-GITHUB-REPO-URL> \
      --openshift 1 \
      --productionEnvironment <YOUR-PROD-ENV> \
      --branches <THE-BRANCHES-YOU-WANT-TO-DEPLOY> \
      --project <YOUR-PROJECT-NAME>
    ```
      * The value for `--openshift` is the ID of your Kubernetes cluster.
      * Your production environment should be the name of the branch you want to have as your production   environment.
      * The branches you want to deploy might look like this: “^(main|develop)$”
      * The name of your project is anything you want - “Company Website,” “example,” etc.
2. Go to the Lagoon UI, and you should see your project listed!

## Add the deploy key to your git repository

Lagoon creates a deploy key for each project. You now need to add it as a deploy key in your Git repository to allow Lagoon to download the code.

1. Run the following command to get the deploy key:
    ```bash
    lagoon get project-key --project <YOUR-PROJECT-NAME>
    ```
2. Copy the key and save it as a deploy key in your Git repository.

[GitHub](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys){ .md-button }
[GitLab](https://docs.gitlab.com/ee/user/project/deploy\_keys/){ .md-button }
[Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/add-access-keys/){ .md-button }

## Add the webhooks endpoint to your git repository

In order for Lagoon to be able to deploy on code updates, it needs to be connected to your git repository

1. Add your Lagoon cluster's webhook endpoint to your git repository
    * Payload URL: `<LAGOON-WEBHOOK-INGRESS>`
    * Content Type: JSON
    * Active: Active (allows you to enable/disable as required)
    * Events: Select the relevant events, or choose All.  Usually Push, Branch Create/Delete are required

[GitHub](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks){ .md-button }
[GitLab](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html){ .md-button }
[Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/manage-webhooks/){ .md-button }
