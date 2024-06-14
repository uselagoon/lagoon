# Drupalの初回デプロイメント

![excited](https://i.giphy.com/media/7kVRZwYRwF1ok/giphy-downsized.gif)

## 1. すべてが準備できていることを確認してください { #1-make-sure-you-are-all-set }

初回のデプロイメントを成功させるためには、あなたの[DrupalプロジェクトがLagoon化されている](../../using-lagoon-the-basics/setup-project.md)ことと、Lagoonでプロジェクトが設定されていることを確認してください。そうでない場合でも心配はいりません！[ステップバイステップガイド](./step-by-step-getting-drupal-ready-to-run-on-lagoon.md)を参照して作業方法を確認してください。

## 2. プッシュ { #2-push }

Lagoonでは、デプロイするために設定されたブランチにプッシュすることで新しいデプロイメントを作成します。

新たにプッシュするコードがない場合でも心配はいりません、次のコマンドを実行できます。

```bash title="Git push"
git commit --allow-empty -m "go, go! Power Rangers!"
git push
```

これによりプッシュがトリガーされ、設定されたWebhookを通じてGitホスティングがこのプッシュについてLagoonに通知します。

すべてが正しければ、設定されたチャットシステムに通知が表示されます（これは親切なLagoon管理者によって設定されます）：

![デプロイメント開始のSlack通知](../../images/first_deployment_slack_start.jpg)

これは、Lagoonがあなたのコードのデプロイを開始したことを示しています。コードのサイズによりますが、 ベースとコンテナの量により、これには数秒かかります。リラックスしてお待ちください。今何が起こっているか知りたい場合は、[Lagoonのビルドとデプロイプロセス](../../concepts-basics/build-and-deploy-process.md)をご覧ください。

また、Lagoon UIをチェックして、任意のデプロイメントの進行状況を確認することもできます（Lagoonの管理者が情報を持っています）。

## 3. 失敗 { #3-a-fail }

`.lagoon.yml`で定義されたポストロールアウトタスクにより、`drush updb`や`drush cr`のようなタスクを実行したかもしれません。これらのDrushタスクは、環境内に存在しているデータベースに依存していますが、明らかにまだ存在していません。それを修正しましょう！読み進めてください。

## 4. ローカルデータベースをリモートのLagoon環境に同期する { #4-synchronize-local-database-to-the-remote-lagoon-environment }

LagoonではフルのDrushサイトエイリアスをサポートしているため、ローカルデータベースをリモートのLagoon環境と同期することができます。

!!! 警告
    次のステップの前に、pygmyに公開キーについて教える必要があるかもしれません。

`Permission denied (publickey)`のようなエラーが表示された場合は、ここに記載のドキュメンテーションをチェックしてみてください：[pygmy - sshキーの追加](https://pygmy.readthedocs.io/en/master/ssh_agent)

まず、Drushサイトエイリアスが表示されることを確認しましょう：

```bash title="サイトエイリアスの取得"
drush sa
```

これにより、あなたの デプロイされた環境（`develop`にプッシュしたとします）：

```bash title="返されたサイトエイリアス"
[drupal-example]cli-drupal:/app$ drush sa
@develop
@self
default
```

これにより、ローカルデータベース（Drushではサイトエイリアス`@self`で表されます）とリモートデータベース（`@develop`）を同期することができます。

```bash title="Drush sql-sync"
drush sql-sync @self @develop
```

次のような結果が表示されるはずです：

```bash title="Drush sql-syncの結果"
[drupal-example]cli-drupal:/app$ drush sql-sync @self @develop
You will destroy data in ssh.example.com/drupal and replace with data from drupal.
Do you really want to continue? (y/n): y
Starting to dump database on Source.                                                                              [ok]
Database dump saved to /home/drush-backups/drupal/20180227075813/drupal_20180227_075815.sql.gz               [success]
Starting to discover temporary files directory on Destination.                                                    [ok]
You will delete files in drupal-example-develop@ssh.example.com:/tmp/drupal_20180227_075815.sql.gz and replace with data from /home/drush-backups/drupal/20180227075813/drupal_20180227_075815.sql.gz
Do you really want to continue? (y/n): y
Copying dump file from Source to Destination.                                                                     [ok]
Starting to import dump file onto Destination database.
```

さて、再度デプロイを試してみましょう。今度は空のプッシュです：

```bash title="Git push"
git commit --allow-empty -m "行け、行け！ パワーレンジャー！"
git push
```

今回はすべてがグリーンになるはずです：

![デプロイ成功！](../../images/first_deployment_slack_success.jpg)

通知内のリンクをクリックすると、Drupalサイトが全ての美しさでロードされるのが見えるはずです！まだ画像がない可能性がありますが、それは[ステップ6](./first-deployment-of-drupal.md#6-synchronize-local-files-to-the-remote-lagoon-environment)で対処します。

それでも失敗する場合は、ログリンクを確認して詳細情報を得てください。

## 5. ローカルファイルをリモートのLagoon環境に同期する { #5-synchronize-local-files-to-the-remote-lagoon-environment }

おそらく推測できたでしょう：Drushでそれを行うことができます：

```bash title="Drush rsync"
drush rsync @self:%files @develop:%files
```

次のような表示が出るはずです：

```bash title="Drush rsync results"
[drupal-example]cli-drupal:/app$ drush rsync @self:%files @develop:%files
You will delete files in drupal-example-develop@ssh.example.com:/app/web/sites/default/files and replace with data from /app/web/sites/default/files/
Do you really want to continue? (y/n): y
```

その理由は、Drupalがファイルディレクトリのパスを解決できないからです。これはおそらく、Drupalが完全に設定されていないか、データベースが欠けているためです。回避策としては`drush rsync @self:sites/default/files @develop:sites/default/files`を使用できますが、ローカルとリモートのDrupalを実際に確認することをお勧めします（`drush status`でファイルディレクトリが正しく設定されているかどうかをテストできます）。

## 6. 完了しました { #6-its-done }

Lagoonがビルドとデプロイを完了すると、チャットシステムに2回目の通知を送信します。以下のような感じです：

![完全なデプロイメントのSlack通知。](../../images/first_deployment_slack_2nd_success.jpg)

これには以下の情報が表示されます：

* デプロイされたプロジェクト
* デプロイされたブランチとGit SHA
* ビルドとデプロイメントの完全なログへのリンク
* 環境にアクセスできるすべてのルート（URL）へのリンク

以上です！それが難しすぎなければよいのですが、私たちはDevOpsを使いやすくすることを目指しています。

## しかし、他のブランチや本番環境はどうですか？ { #but-wait-how-about-other-branches-or-the-production-environment }

それがLagoonの美点です：まったく同じです。本番ブランチとして定義したブランチ名をプッシュすると、そのブランチがデプロイされます。

## 失敗？心配しないで { #failure-dont-worry }

デプロイメントが失敗しましたか？ああ、それは大変です！でも、私たちは助けるためにここにいます：

1. エラー通知の中の `logs` リンクをクリックします。それは失敗が発生したデプロイメントプロセスのどこであったかを教えてくれます。
2. それがわからない場合は、Lagoonの管理者に尋ねてみてください。彼らは助けるためにここにいます！
