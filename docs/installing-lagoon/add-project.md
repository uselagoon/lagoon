# Add a Project

1. Run this command: `lagoon add project --gitUrl <YOUR-GITHUB-REPO-URL> --openshift 1 --productionEnvironment <YOUR-PROD-ENV> --branches <THE-BRANCHES-YOU-WANT-TO-DEPLOY> --project <YOUR-PROJECT-NAME>`
   1. The value for `--openshift` is the ID of your Kubernetes cluster.
   2. Your production environment should be the name of the branch you want to have as your production environment.
   3. The branches you want to deploy might look like this: “^(main|develop)$”
   4. The name of your project is anything you want - “Company Website,” “example,” etc.&#x20;
2. Go to the Lagoon UI, and you should see your project listed!
