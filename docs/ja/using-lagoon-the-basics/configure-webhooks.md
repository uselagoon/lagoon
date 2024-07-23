# Webhooksの設定

Lagoonの管理者は、`webhook-handler`へのルートもあなたに教えてくれるでしょう。このルートをリポジトリのアウトゴーイングwebhookに追加し、Lagoonに送信するイベントを選択します。通常は全てのプッシュとプルリクエストイベントを送信します。Lagoonではどのブランチやプルリクエストが実際にデプロイされるかを決定するための正規表現を追加することができ、Lagoonの管理者がそれを設定することができます。例えば、`feature-`で始まる全てのブランチをLagoonにデプロイすることができます。

<!-- markdown-link-check-disable -->
???+ Info "amazee.ioのお客様への情報"
    amazee.ioを利用しているで場合、webhook-handlerへのルートは次のとおりです。[`https://hooks.lagoon.amazeeio.cloud`](https://hooks.lagoon.amazeeio.cloud)
    <!-- markdown-link-check-enable -->

!!! Danger "危険"
      以下の設定を管理するには、これらのリポジトリへの高いレベルのアクセスが必要となります。これはあなたの組織によって管理されます。これらの設定にアクセスできない場合は、システム管理者またはあなたの組織内の適切な責任者に連絡してください。

## GitHub

1. GitHubリポジトリで設定 -> Webhooks -> `Add webhook`に進みます。 ![GitHubでwebhookを追加します。](../images/webhooks-2020-01-23-12-40-16.png)
2. `Payload URL`は、あなたのLagoon管理者から提供される、あなたのLagoonインスタンスの`webhook-handler`へのルートです。
3. `Content type`を`application/json`に設定します。
  ![Payload URLを追加し、Content typeを設定します。](../images/gh_webhook_1.png)
4. "`Let me select individual events`"を選択します。
5. どのイベントがwebhookをトリガーするかを選択します。`Push`と`Pull request`のイベントを送信し、プロジェクトのLagoon設定でさらにフィルタリングすることをお勧めします。
  ![GitHubでwebhookイベントトリガーを選択します。](../images/gh_webhook_2.png)
6. webhookが`Active`に設定されていることを確認します。
7. `Add webhook`をクリックして設定を保存します。

## GitLab

1. GitLabリポジトリで設定 -> インテグレーションに移動します。
  ![GitLabリポジトリで設定 &amp;gt; インテグレーションに移動します。](../images/gitlab-settings.png)
2. `URL`は、Lagoonの管理者から提供される、Lagoonインスタンスの`webhook-handler`へのルートです。
3. Lagoonに通知を送信する`Trigger`イベントを選択します。`Push events`と`Merge request events`を選択し、その後Lagoonの設定でさらにフィルタリングすることをお勧めします。
  ![GitLabでトリガーイベントを選択する。](../images/gitlab_webhook.png)
4. `Add webhook`をクリックして設定を保存します。

## Bitbucket

1. リポジトリで設定 -> ウェブフック -> 新しいウェブフックを追加に移動します。
2. `Title`は参照用です。
3. `URL`はあなたのLagoonインスタンスの`webhook-handler`へのルートで、Lagoonの管理者によって提供されます。
4. `Choose from a full list of triggers`をクリックし、以下を選択します:

   * Repository
     * PUsh
   * Pull Request
     * Created
     * Updated
     * Approved
     * Approval removed
     * Merged
     * Declined

  ![Bitbucketのウェブフックのためのトリガーを選択します。](../images/bb_webhook_1.png)
5. `Save`をクリックしてBitbucketのウェブフック設定を保存します。
