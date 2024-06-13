# デプロイメントのトリガー

## Azure Pipelinesを使用して新しいデプロイメントをトリガーする

[Azure Pipelines](https://azure.microsoft.com/ja-jp/services/devops/pipelines/)を使用して新しいデプロイメントを自動的にトリガーするには、以下の手順に従ってください：

1. デプロイメントのSSHプライベートキーを`id_rsa_lagoon`としてAzureのセキュアファイルに追加します。セキュアファイルについての詳細は[Azureのドキュメンテーションサイト](https://docs.microsoft.com/ja-jp/azure/devops/pipelines/library/secure-files?view=azure-devops)をご覧ください。
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
            curl -L "https://github.com/amazeeio/lagoon-cli/releases/download/0.9.2/lagoon-cli-0.9.2-linux-amd64" -o ./lagoon
            chmod +x ./lag oon
          displayName: 'lagoon-cliをダウンロード'
        - script: ./lagoon login -i $(lagoonSshKey.secureFilePath)
          displayName: 'Lagoonにログイン'
        - script: ./lagoon deploy branch -e $(Build.SourceBranchName) -p my-awesome-project -b $(Build.SourceBranchName) --force
          displayName: 'lagoon-cliを使用してデプロイメントをトリガー'
```

これにより、`develop`ブランチまたは`staging`ブランチで変更が行われるたびに新しいデプロイメントがトリガーされます。これらの値を適切に調整して、デプロイメント戦略と設定に適合させてください。

## デプロイせずにプッシュ

デプロイせずにプッシュしたい場合があるかもしれません。コミットメッセージに "`[skip deploy]`" または "`[deploy skip]`" が含まれていることを確認してください。そうすると、Lagoonはそのコミットからデプロイメントをトリガーしません。