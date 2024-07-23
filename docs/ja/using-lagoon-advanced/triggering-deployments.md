# デプロイメントのトリガー

## Azure Pipelinesを使用して新しいデプロイをトリガーする

[Azure Pipelines](https://azure.microsoft.com/ja-jp/services/devops/pipelines/)を使用して新しいデプロイを自動的にトリガーするには、以下の手順を行ってください。

1. デプロイのSSHプライベートキーを`id_rsa_lagoon`としてAzureのセキュアファイルに追加します。セキュアファイルについての詳細は[Azureのドキュメント](https://docs.microsoft.com/ja-jp/azure/devops/pipelines/library/secure-files?view=azure-devops)をご覧ください。
2. 以下の設定を`azure-pipelines.yml`に追加します。

```yaml title="azure-pipelines.yml"
pool:
  vmImage: 'ubuntu-latest'

stages:
  # .. 他のステージ
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

これにより、`develop`ブランチまたは`staging`ブランチで変更が行われるたびに新しいデプロイがトリガーされます。これらの値を適切に調整して、デプロイ戦略と設定に適合させてください。

## デプロイせずにプッシュ

デプロイせずにプッシュしたい場合があるかもしれません。コミットメッセージに "`[skip deploy]`" または "`[deploy skip]`" を含んでください。そうすると、Lagoonはそのコミットからデプロイをトリガーしません。
