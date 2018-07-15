# Workflows

Lagoon tries to support any development workflow possible, it specifically does not enforce any workflows onto the teams, so that each development team can define how they would like to develop and deploy their code.

### Fixed Branches

The most obvious and easiest workflow are deployment based on some fixed branches:

You define which branches (like `develop`, `staging` and `master`, which would be `^(develop|staging|master)$` as regex) that Lagoon should deploy and it will do so. Easy as pie!

If you like to test a new feature, just merge them into a branch that you have setup locally and push, Lagoon will deploy the feature and you can test. When all is good, merge the branch into your production branch and push.


### Feature Branches

A bit advanced are feature branches. As Lagoon supports to define the branches you would like to deploy via regex definitions, you can also do something like: `^feature/|