# Workflows

Lagoon tries to support any development workflow possible. It specifically does not enforce any workflows onto teams, so that each development team can define how they would like to develop and deploy their code.

## Fixed Branches

The most obvious and easiest workflow are deployment-based on some fixed branches:

You define which branches \(like `develop`, `staging` and `master`, which would be `^(develop|staging|master)$` as regular expressions\) that Lagoon should deploy and it will do so. Done!

If you would like to test a new feature, just merge them into a branch that you have setup locally and push, and Lagoon will deploy the feature and you can test. When all is good, merge the branch into your production branch and push.

## Feature Branches

A bit more advanced are feature branches. As Lagoon supports to define the branches you would like to deploy via regular expression definitions, you can also extend the above regular expression to this: `^feature\/|^(staging|master)$`, this will instruct Lagoon to deploy also all branches that start with `feature/`, plus the branches called `staging` and `master`. Our development workflow could be as following:

* Create a new branch from `master` called `feature/myfeature` and push `feature/myfeature`
* Lagoon will deploy the branch `feature/myfeature` as a new environment, where you can test your feature independently of any other features.
* Merge `feature/myfeature` into the `master` branch and it will deploy your production environment.

If you like you can also merge `feature/myfeature` and any other feature branches first into `staging` in order to have a so called integration branch, to test the functionality of multiple features together. After you have tested the features together on staging, you can merge the features into master.

This workflow needs a high cleanliness of branches on the Git hosting, as each feature branch will create it's own Lagoon environment, you can have very fast a LOT of environments, which all of them will use resources.

Therefore it could make sense to think about a pull request based workflow:

## Pull requests

Even more advanced are workflows via pull requests. Such workflows need the support of a Git hosting which supports pull requests \(also called merge requests\). The idea of pull request based workflows lies behind that idea that you can test a feature together with a target branch, without actually needing to merge yet, as Lagoon will do the merging for you during the build.

In our example we would configure Lagoon to deploy the branches: `^(staging|master)$` and the pull requests to `.*` \(basically to deploy all pull requests\). Now the workflow would be:

* Create a new branch from `master` called `feature/myfeature` and push `feature/myfeature` \(no deployment will happen now\)
* Create a pull request in your Git hosting from `feature/myfeature` into `master`
* Lagoon will now merge the `feature/myfeature` branch merged on top of the `master` branch and deploy that resulting code for you
* Now you can test the functionality of the `feature/myfeature` branch like it would already have been merged into `master`, so all changes that have happened in `master` since you create the  `feature/myfeature` branch from it will be there and you don't need to worry that you might have an older version of the `master` branch.
* After you have confirmed that everything works like you want it, you can go back to your Git hosting and actually merge the code into `master`, this will now trigger a deployment of `master`.
* With the merge of the pull request it is automatically closed and Lagoon will remove the environment for the pull request fully automatically.

Some teams might opt in to create the pull request against a shared `staging` branch and then merge the `staging` branch into the `master` branch via another Pull request.

Additionally in Lagoon you can define that only pull request with a specific text in the title are deployed. Like `[BUILD]` defined as regular expression, will only deploy pull requests that have a title like `[BUILD] My Pull Request`, while a Pull request with that title `My other Pull Request` is not automatically deployed. This helps to keep the amount of environments small and allows for Pull requests that don't need an environment yet.

### Automatic Database Sync for Pull requests

Automatic Pull request environments are a fantastic thing. But it would also be handy to have the Database synced from another environment.

Following example will sync the staging database on the first rollout of the Pull request environment:

```yaml
tasks:
  post-rollout:
    - run:
        name: IF no Drupal installed & Pullrequest = Sync database from staging
        command: |
            if [[ -n ${LAGOON_PR_BASE_BRANCH} ]] && tables=$(drush sqlq 'show tables;') && [ -z "$tables" ]; then
                drush -y sql-sync @staging default
            fi
        service: cli
        shell: bash
```

## Promotion

Another way of deploying your code into an environment is the Promotion Workflow. The idea behind the promotion workflow comes from the fact that even if you merge \(as an example\) the branch `staging` into the `master` branch and if there were no changes in `master` before, so `master` and `staging` have the exact same code in the Git repository, it could still technically be possible that the resulting Docker Images are slightly different, this comes from the fact that between the last `staging` deployment and the current `master` deployment maybe some upstream Docker Images have changed or dependencies loaded from the various package managers have changed. This is a very small chance, but it's there.

For this Lagoon has the understanding of promoting Lagoon Images from one environment to another. Which basically means that it will take the already built and deployed Docker Images from one environment and will use the exact same Docker Images for another environment.

In our example we want to promote the docker images from `master` environment to the environment `production`:

* First we need a regular deployed environment with the name `master`, make sure that the deployment successfully ran through.
* Also make sure that you don't have a branch `production` in your Git Repository, as this could lead into weird confusions \(like people pushing into this branch, etc.\).
* Now trigger a promotion deployment via this curl request:

```bash
  curl -X POST \
      https://rest.lagoon.amazeeio.cloud/promote \
      -H 'Content-Type: application/json' \
      -d '{
          "projectName":"myproject",
          "sourceEnvironmentName": "master",
          "branchName": "production"
      }'
```

This defines, that you like to promote from the source `master` to the destination `production` \(yes it really uses `branchName` as destination, which is a bit unfortunate, but this is gonna be fixed soon.\)

Lagoon will now do the following:

* Checkout the Git branch `master` in order to load the `.lagoon.yml` and `docker-compose.yml` \(Lagoon still needs these in order to fully work\)
* Create all Kubernetes/OpenShift objects for the defined services in `docker-compose.yml` but with `LAGOON_GIT_BRANCH=production` as environment variable
* Copy the newest Images from the `master` environment and use them \(instead of building Images or tagging them from upstream\)
* Run all post-rollout tasks like a normal deployment

You will receive the same notifications of success or failures like any other deployment.

