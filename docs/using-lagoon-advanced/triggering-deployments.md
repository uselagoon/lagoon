# Triggering Deployments

## Trigger a new deployment using Azure Pipelines

In order to automatically trigger new deployments using [Azure Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/) follow these instructions:

1. Add your deployment SSH private key to Azure as a secure file as `id_rsa_lagoon`. For more information about secure files have a look at the [Azure Documentation Site](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/secure-files?view=azure-devops).
2. Add the following configuration to your `azure-pipelines.yml`:

```yaml title="azure-pipelines.yml"
pool:
  vmImage: 'ubuntu-latest'

stages:
  # .. other stages
  - stage: Deploy
    condition: and(succeeded(), in(variables['Build.SourceBranch'], 'refs/heads/staging', 'refs/heads/develop'))
    jobs:
      - job: DeployLagoon
        steps:
        - task: DownloadSecureFile@1
          name: lagoonSshKey
          displayName: 'Download Lagoon SSH key'
          inputs:
            secureFile: id_rsa_lagoon
        - script: |
            curl -L "https://github.com/uselagoon/lagoon-cli/releases/download/v0.21.3/lagoon-cli-v0.21.3-linux-amd64" -o ./lagoon
            chmod +x ./lagoon
          displayName: 'Download lagoon-cli'
        - script: ./lagoon login -i $(lagoonSshKey.secureFilePath)
          displayName: 'Log into Lagoon'
        - script: ./lagoon deploy branch -e $(Build.SourceBranchName) -p my-awesome-project -b $(Build.SourceBranchName) --force
          displayName: 'Trigger deployment using lagoon-cli'
```

This will trigger a new deployment whenever changes are made on the `develop` or `staging` branch. Adjust these values accordingly so they fit your deployment strategy and configuration.

## Push without deploying

There may be a case where you want to push without a deployment. Make sure your commit message contains "`[skip deploy]`" or "`[deploy skip]`" and Lagoon will not trigger a deployment from that commit.
