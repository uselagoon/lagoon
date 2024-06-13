# よくある質問

## ラグーンの管理者にどのように連絡すればよいですか？

専用のSlackチャネルが設定されているはずなので、それを利用してコミュニケーションを取ることができます - もしない場合や、どのように連絡すればよいか忘れてしまった場合は、[support@amazee.io](mailto:support@amazee.io)に連絡して下さい。

## バグを見つけました！🐞

バグやセキュリティ問題を見つけた場合は、その内容を[support@amazee.io](mailto:support@amazee.io)に送ってください。GitHubの問題として報告しないでください。

## amazee.ioのラグーンを利用したホスティングサービスに興味があります

それは素晴らしいニュースです！[sales@amazee.io](mailto:sales@amazee.io)までメールでお問い合わせいただけます。

## バックアップをどのように復元することができますか？

ファイルやデータベースのバックアップを提供しており、通常は最大で24時間ごとに取得しています。これらのバックアップはオフサイトで保存されています。

日次バックアップは最大7つ、週次バックアップは最大4つ保持しています。

バックアップの復元や回復が必要な場合は、お気軽にチケットを提出するか、チャットでメッセージを送ってください。喜んでお手伝いします！

## データベースダンプをどのようにダウンロードすることができますか？

<iframe width="560" height="315" src="https://www.youtube.com/embed/bluTyxKqLbw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in -ピクチャー" allowfullscreen></iframe>

## 私は無効なSSL証明書エラーが出ています

まず最初に試すべきことは、[私たちのドキュメンテーションに記載されているSSLに関する情報](../concepts-basics/lagoon-yml.md#ssl-configuration-tls-acme)を参照してみてください。

その手順に従ってもまだエラーが出る場合は、チケットを送信するか、チャットでメッセージを送ってください。私たちはあなたの問題を解決するのをお手伝いします。

## Drushコマンドを実行するときに "Array" エラーが出ています

これはDrushバージョン8.1.16と8.1.17で多く見られたバグで、エラーは次のようなものでした：

```bash
コマンドを正常に実行できませんでした（返却：Array [error]
(
[default] => Array
(
[default] => Array
(
[driver] => mysql
[prefix] => Array
(
[default] =>
)
, code: 0)
エラー：ソース@mainのデータベースレコードが見つかりませんでした [error]
```

Drushをアップグレードすると、この問題は解消されるはずです。我々は強く、バージョン8.3またはそれ以降を使用することをお勧めします。Drushをアップグレードすれば、コマンドは動作するはずです！

## Kibanaログにアクセスしようとすると、Internal Server Errorが表示されています

<iframe width="560" height="315" src="https://www.youtube.com/embed/BuQo5J0Qc2c" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; パニックになる必要はありません！これは通常、テナントが選択されていないときに発生します。これを修正するには、次の手順を実行してください：

1. Kibanaの左側のメニューで「テナント」に移動します。
2. 自分のテナント名をクリックします。
3. 「テナントの変更」とあなたのテナントの名前というポップアップウィンドウが表示されます。
4. 「ディスカバー」タブに戻り、クエリを再度試みます。

これでログを見ることができるはずです。

## 任意の環境にSSHで接続できない

任意の環境にSSHで接続できません。次のメッセージが表示されます： `Permission denied (publickey)`。`drush sa`を実行すると、エイリアスが返されません。

これは通常、Pygmyの問題を示しています。Pygmyのトラブルシューティングドキュメントはこちらで見つけることができます：[https://pygmy.readthedocs.io/en/master/troubleshooting/](https://pygmy.readthedocs.io/en/master/troubleshooting/)

## ビルドのステータスを確認するにはどうすればいいですか？

<iframe width="560" height="315" src="https://www.youtube.com/embed/PyrlZqTjf68" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## どのようにして追加しますか クロンジョブとは？

<iframe width="560" height="315" src="https://www.youtube.com/embed/Yd_JfDyfbR0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 新しいルートを追加するには？

<iframe width="560" height="315" src="https://www.youtube.com/embed/vQxh87F3fW4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## ルートを削除するには？

Lagoonは、`.lagoon.yml`からルートが削除されたことをデプロイ時に検出します。デプロイログを確認して、ルートが自動的に削除されたか、それらを削除する方法について確認してください。

## `pygmy status`を実行すると、キーがロードされません

SSHキーをpygmyにロードする必要があります。方法はこちら：[https://pygmy.readthedocs.io/en/master/ssh_agent](https://pygmy.readthedocs.io/en/master/ssh_agent)

## `drush sa`を実行すると、エイリアスが返されません

これは通常、Pygmyに問題があることを示しています。Pygmyのトラブルシューティングドキュメントはこちらで見つけることができます：[https://pygmy.readthedocs.io/en/master/troubleshooting]( https://pygmy.readthedocs.io/en/master/troubleshooting)

## 「drushはより機能的な環境が必要です」というメッセージが表示され、デプロイが失敗する

これは通常、プロジェクトにアップロードされたデータベースがないことを意味します。[プロジェクトにデータベースを追加するためのステップバイステップガイド](../applications/drupal/first-deployment-of-drupal.md#5-synchronize-local-database-to-the-remote-lagoon-environment)を参照してください。

## Pygmyを起動すると「アドレスはすでに使用中」エラーが表示されますか？

`ユーザーランドプロキシの起動エラー: listen tcp 0.0.0.0:80: bind: address already in use Error: failed to start containers: amazeeio-haproxy`

これは既知のエラーです！ほとんどの場合、ポート80ですでに何かが実行されていることを意味します。次のクエリを実行することで犯人を見つけることができます:

```bash title=""
netstat -ltnp | grep -w ':80'
```

これにより、ポート80で実行中のすべてをリストアップします。ポート80で動作しているプロセスを終了させます。ポート80が解放されると、Pygmyはこれ以上のエラーなく起動するはずです。

## プロジェクトのブランチ/PR環境/本番環境をどのように変更できますか？

その変更はLagoon APIを使用して行うことができます！この変更に関するドキュメンテーションは[GraphQLのドキュメンテーションで見つけることができます](../interacting/graphql-queries)。 .md#updating-objects).

## リダイレクトを追加するにはどうすればいいですか？

<iframe width="560" height="315" src="https://www.youtube.com/embed/rWb-PkRDhY4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## プロジェクト/グループに新しいユーザー（およびSSHキー）を追加するにはどうすればいいですか？

これはLagoon APIを介して行うことができます。この変更のステップドキュメンテーションは[私たちのGraphQLドキュメンテーション](../interacting/graphql-queries.md#allowing-access-to-the-project)で見つけることができます。

## 環境は完全に削除して、プロジェクトに大きなコード変更を展開できますか？

環境は各デプロイで完全にゼロから構築され、古いデータベースとファイルを削除してコードをプッシュすると、新鮮なクリーンなビルドが得られます。再同期を忘れないでください！

GraphQLを介して環境を削除することも可能です。指示は[私たちのGraphQLドキュメンテーション](../interacting/graphql-queries.md#deleting-environments)で見つけることができます。

## 新しい環境変数を表示させるにはどうすればいいですか？

GraphQLを介してプロダクション環境にランタイム環境変数を追加したら、デプロイを行うだけで新しい環境変数を表示させることができます。 あなたの環境に変更が反映されるようになります。

## Lagoon環境にSFTPでファイルを送信/取得するにはどうすればいいですか？

クラウドホスティングのお客様は、以下の情報を使用してLagoon環境にSFTPで接続することができます：

* サーバーホスト名: `ssh.lagoon.amazeeio.cloud`
* ポート: 32222
* ユーザー名: &lt;プロジェクト-環境-名&gt;

ユーザー名は、接続する環境の名前になります。最も一般的なパターンは_`PROJECTNAME-ENVIRONMENT`_です。

また、新しいLagoon Syncツールについてもチェックしてみてください。ここで詳細を読むことができます: [https://github.com/uselagoon/lagoon-sync](https://github.com/uselagoon/lagoon-sync)

認証は、SSH公開鍵と秘密鍵の認証を通じて自動的に行われます。

## Let's Encryptを使用したくない。私がインストールしたいSSL証明書があります

それについては確かにお手伝いできます。自分のSSL証明書を手に入れたら、遠慮なくチケットを提出するか、チャットでメッセージを送ってください。喜んでお手伝いします！以下のファイルを送信する必要があります：

* 証明書キー (.key)
* 証明書ファイル (.crt)
* 中間証明書 (.crt)

また、[`.lagoon.yml`で`tls-acme`オプションをfalseに設定する](../concepts-basics/lagoon-yml.md#ssl-configuration-tls-acme)。

## Lagoonに外部ボリューム（EFS/Fuse/SMB/etc）をマウントすることは可能ですか？

外部ボリュームのマウントは、コンテナ内部で完全に処理する必要があり、Lagoonはこの種の接続をプラットフォームの一部として提供していません。

開発者は、必要なパッケージをコンテナにインストール（[Dockerfile](https://docs.docker.com/engine/reference/builder/)経由）し、ボリュームマウントが[事前または事後のロールアウトタスク](../concepts-basics/lagoon-yml.md#tasks)経由で接続されていることを確認することでこれを処理できます。

## Lagoonのビルドを停止する方法はありますか？

長時間実行されているビルドを停止したい場合は、サポートに連絡する必要があります。現在、ビルドはクラスタへの管理者アクセス権を持つユーザーのみが停止できます。

## Elasticsearch\Solrサービスをウェブサイトにインストールしました。ブラウザからUI（ポート9200/8983）へのアクセスをどのように取得できますか？
<!-- markdown-link-check-disable-next-line -->
デプロイされた環境でウェブサービス（NGINX/Varnish/Node.js）のみを公開することをお勧めします。ローカルでは、これらのサービスのポートマッピングを`docker-compose ps`で確認して取得できます。 `, そして [`http://localhost`](http://localhost/)`:<port>` をブラウザで読み込みます。

## ここでは答えられない質問があります

[Discord](https://discord.gg/te5hHe95JE) または [uselagoon@amazee.io](mailto:uselagoon@amazee.io) のメールアドレスでチームに連絡することができます。
