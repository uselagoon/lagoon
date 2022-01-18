# Deploy Your Project

1. Run the following command to deploy your project: `` lagoon deploy branch -p <YOUR-PROJECT-NAME> -b <YOUR-BRANCH-NAME>` ``
2. Go to the Lagoon UI and take a look at your project - you should now see the environment for this project!
3. Look in your cluster at your pods list, and you should see the build pod as it begins to clone Git repositories, set up services, etc.&#x20;
   1. e.g. `kubectl get pods --all-namespaces | grep lagoon-build`
