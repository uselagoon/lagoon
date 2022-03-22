# Add Deploy Key

Lagoon creates a deploy key for each project. You now need to add it as a deploy key in your Git repository.

1. Run the following command to get the deploy key: `lagoon get project-key --project <projectname>`
2. Copy the key and save it as a deploy key in your Git repository.
   1. Instructions for adding a deploy key to [GitHub](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys), [GitLab](https://docs.gitlab.com/ee/user/project/deploy\_keys/), [Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/add-access-keys/).
