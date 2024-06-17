# プロジェクトの追加

## プロジェクトをLagoonに追加する

1. 以下のコマンドを実行します:

  ```bash title="プロジェクトの追加"
  lagoon add project \
    --gitUrl <YOUR-GITHUB-REPO-URL> \
    --openshift 1 \
    --productionEnvironment <YOUR-PROD-ENV> \
    --branches <THE-BRANCHES-YOU-WANT-TO-DEPLOY> \
    --project <YOUR-PROJECT-NAME>
  ```

   * `--openshift`の値は、あなたのKubernetesクラスタのIDです。
   * 本番環境は、本番環境として使用したいブランチの名前であるべきです。
   * デプロイしたいブランチは、次のようになる可能性があります:`“^(main|develop)$”`
   * プロジェクトの名前は何でも良い - “会社のウェブサイト,” “例,” などです。

2. Lagoon UIに移動し、プロジェクトがリストに表示されているはずです！

## デプロイキーをGitリポジトリに追加する

Lagoonは各プロジェクトにデプロイキーを作成します。これをGitリポジトリのデプロイキーとして追加することで、Lagoonがコードをダウンロードできるようにする必要があります。

1. デプロイキーを取得するために以下のコマンドを実行します:

    ```bash title="プロジェクトキーの取得"
    lagoon get project-key --project <YOUR-PROJECT-NAME>
    ```

2. キーをコピーし、Gitリポジトリのデプロイキーとして保存します。

[GitHub](https://docs.github.com/en/de 開発者/概要/デプロイキーの管理#deploy-keys) {.md-button}
[GitLab](https://docs.gitlab.com/ee/user/project/deploy\_keys/){ .md-button }
[Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/add-access-keys/){ .md-button }

## Gitリポジトリにwebhooksエンドポイントを追加する

Lagoonがコードの更新時にデプロイできるように、Gitリポジトリに接続する必要があります。

1. LagoonクラスタのwebhookエンドポイントをGitリポジトリに追加します。

  * ペイロードURL: `<LAGOON-WEBHOOK-INGRESS>`
  * コンテンツタイプ: JSON
  * アクティブ: アクティブ(必要に応じて有効/無効を切り替えることができます)
  * イベント: 関連するイベントを選択するか、全てを選択します。通常はプッシュ、ブランチの作成/削除が必要です

[GitHub](https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks){ .md-button }
[GitLab](https://docs.gitlab.com/ee/user/project/integrations/webhooks.html){ .md-button }
[Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/manage-webhooks/){ .md-button }
