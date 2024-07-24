# ロギング

LagoonはKibanaを介して以下のログにアクセスを提供します:

* Kubernetesルーターからのログには、すべてのHTTPおよびHTTPSリクエストが含まれています。:
  * ソースIP
  * URL
  * パス
  * HTTP動詞
  * Cookies
  * ヘッダー
  * ユーザーエージェント
  * プロジェクト
  * コンテナ名
  * 応答サイズ
  * 応答時間
* コンテナのログ:
  * `stdout`と`stderr`メッセージ
  * コンテナ名
  * プロジェクト
* Lagoonのログ:
  * Webhooksの解析
  * ビルドログ
  * ビルドエラー
  * その他のLagoon関連ログ
* アプリケーションのログ:
  * Drupalの場合: Drupal Watchdogからのログを受け取るために、[Lagoon Logs](https://www.drupal.org/project/lagoon_logs)モジュールをインストールします。
  * Laravelの場合: [Laravel用Lagoon Logs](https://github.com/amazeeio/laravel_lagoon_logs)パッケージをインストールします。
  * その他のワークロード:
    * ログを`udp://application-logs.lagoon.svc:5140`に送信します。
    * ログがJSONエンコードされたオブジェクトとして構造化されていることを確認します。
    * `type`フィールドにKubernetesネームスペースの名前が含まれていることを確認してください(`$LAGOON_PROJECT-$LAGOON_ENVIRONMENT`)。

ログにアクセスするには、Lagoon管理者に連絡してKibanaルートのURLを取得してください（amazee.ioの場合は[https://logs.amazeeio.cloud/](https://logs.amazeeio.cloud/)です)。

各Lagoonユーザーアカウントには個別のログインがあり、アクセス権のあるプロジェクトのログのみが表示されます。

各Lagoonユーザーアカウントはまた、独自の**Kibana Tenant**を持っており、これは保存された検索やビジュアライゼーションが他のアカウントと共有されないことを意味します。

Kibanaの使用方法について詳しく知りたい場合は、こちらをご覧ください:
[https://www.elastic.co/webinars/getting-started-kibana](https://www.elastic.co/webinars/getting-started-kibana)
