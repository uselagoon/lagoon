# Workflows

Lagoon tries to support any development workflow possible, it specifically does not enforce any workflows onto the teams, so that each development team can define how they would like to develop and deploy their code.

### Fixed Branches

The most obvious and easiest workflow are deployment based on some fixed branches:

You define which branches (like `develop`, `staging` and `master`, which would be `^(develop|staging|master)$` as regex) that Lagoon should deploy and it will do so. Easy as pie!

If you like to test a new feature, just merge them into a branch that you have setup locally and push, Lagoon will deploy the feature and you can test. When all is good, merge the branch into your production branch and push.


### Feature Branches

A bit advanced are feature branches. As Lagoon supports to define the branches you would like to deploy via regex definitions, you can also extend the above regex to this: `^feature\/|^(staging|master)$`, this will instruct Lagoon to deploy also all branches that start with `feature/`, plus the branches called `staging` and `master`. Our development workflow could be as following:

- Create a new branch from `master` called `feature/myfeature` and push `feature/myfeature`
- Lagoon will deploy the branch `feature/myfeature` as a new environment, where you can test your feature independently of any other features.
- Merge `feature/myfeature` into the `master` branch and it will deploy your production enviornment.

If you like you can also merge `feature/myfeature` and any other feature branches first into `staging` in order to have a so called integration branch, to test the functionality of multiple features together. After you have tested the features together on staging, you can merge the features into master.

This workflow needs a high cleaniness of branches on the Git Hosting, as each feature branch will create it's own Lagoon environment, you can have very fast a LOT of environments, which all of them will use resources.

Therefore it could make sense to think about a Pull Request based workflow:


### Pull Requests

Even more advanced are workflows via Pull Requests. Such workflows need the support of a Git Hosting which supports Pull Requests (or also called Merge Requests). The idea of Pull Request based workflows lies behind that idea that you can test a feature together with a target branch, without actually needing to merge yet, as Lagoon will do the merging for you during the build.

In our example we would configure Lagoon to deploy the branches: `^(staging|master)$` and the Pull Requests to `.*` (basically to deploy all pull requests). Now the workflow would be:

- Create a new branch from `master` called `feature/myfeature` and push `feature/myfeature` (no deployment will happen now)
- Create a Pull Request in your Git Hosting from `feature/myfeature` into `master`
- Lagoon will now merge the `feature/myfeature` branch merged on top of the `master` branch and deploy that resulting code for you
- Now you can test the functionality of the `feature/myfeature` branch like it would already have been merged into `master`, so all changes that have happend in `master` since you create the  `feature/myfeature` barnch from it will be there and you don't need to worry that you might have an older version of the `master` branch.
- After you have confirmed that everything works like you want it, you can go back to your Git Hosting and actually merge the code into `master`, this will now trigger a deployment of `master`.
-  With the merge of the Pull Request it is automatically closed and Lagoon will remove the environment for the pull request fully automatically.

Some teams might opt in to create the Pull Request against a shared `staging` branch and then merge the `staging` branch into the `master` branch via another Pull Request.

Additonally in Lagoon you can define that only Pull Request with a specific text in the title are deployed. Like `[BUILD]` defined as regex, will only deploy Pull Requests that have a title like `[BUILD] My Pull Request`, while a Pull Request with that title `My other Pull Request` is not automatically deployed. This helps to keep the amount of environments small and allows for Pull Requests that don't need an enviornment yet.


### Promotion

Another way of deploying your code into a specific environment is the Promotion Workflow. The idea behind the promotion workflow comes from the fact that even if you merge (as an example) the branch `staging` into the `master` branch and it there where no changes in `master` before, so `master` and `staging` have the exact same code in the git repository it could still technically be possible that the resulting Docker Images are slighly different, this comes from the fact that between the last `staging` deployment and `master` deployment maybe some uptream Docker Images have changes or dependencies loaded from the various package managers have changed. This is a very small chance, but there is a technical chance.

For this Lagoon has the understanding of promoting Lagoon Images from one Environment to another. Which basically means that it will take the already built and deployed Docker Image from one enviornment and will use the byte-by-byte same Docker Images for another enviornment.

In o