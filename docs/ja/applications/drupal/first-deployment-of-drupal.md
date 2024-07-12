# Drupalの初回デプロイメント

![excited](https://i.giphy.com/media/7kVRZwYRwF1ok/giphy-downsized.gif)

## 1. 準備を整えましょう { #1-make-sure-you-are-all-set }

初回のデプロイメントを成功させるためには、[DrupalプロジェクトがLagoon化されている](../../using-lagoon-the-basics/setup-project.md)ことと、Lagoonでプロジェクトをセットアップしていることを確認してください。そうでない場合でも心配はいりません！[ステップバイステップガイド](./step-by-step-getting-drupal-ready-to-run-on-lagoon.md)を参照してください。

## 2. プッシュ { #2-push }

Lagoon を利用している場合、デプロイ用に設定されたブランチに push することで新しいデプロイを作成できます。

新しいコードをpushする必要がない場合でも心配はいりません、以下のコマンドを実行できます。

```bash title="Gitにpush"
git commit --allow-empty -m "go, go! Power Rangers!"
git push
```

プッシュが実行されると、Gitホスティングが設定済みのWebhookを介してLagoonに通知します。

すべて正常であれば、設定済みのチャットシステムに通知が表示されます。(設定についてはLagoon管理者に問い合わせてください):

![デプロイメント開始のSlack通知](../../images/first_deployment_slack_start.jpg)

この通知は、Lagoonがコードのデプロイを開始したことを示しています。デプロイ時間は、コードベースのサイズとコンテナの数によって数秒かかります。しばらくお待ちください。現在の状況を確認したい場合は、[Lagoonのビルドとデプロイプロセス](../../concepts-basics/build-and-deploy-process.md)を参照してください。

デプロイの進行状況は、LagoonUIでも確認できます。(URLがわからない場合は、Lagoon管理者に問い合わせてください)

## 3. 失敗 { #3-a-fail }

`.lagoon.yml`ファイルで定義されているデプロイ後処理タスクによっては、`drush updb`や`drush cr`などのタスクを実行している可能性があります。これらのDrushタスクは、環境内にデータベースが存在することを前提としていますが、デプロイ直後では当然ながらデータベースは存在しません。この問題を解決する方法を次に説明します。

## 4. ローカルデータベースをリモートのLagoon環境に同期 { #4-synchronize-local-database-to-the-remote-lagoon-environment }

Lagoonは完全なDrushサイトエイリアスをサポートしており、ローカルデータベースとリモートのLagoon環境を同期させることができます。

!!! Warning "警告"
    次のステップの前に、pygmyに公開キーを登録する必要があるかもしれません。

`Permission denied (publickey)`などのエラーが発生した場合、こちらのドキュメントを参照してください:[pygmy - sshキーの追加](https://pygmy.readthedocs.io/en/master/ssh_agent)

まずは、Drush サイトエイリアスを確認してみましょう:

```bash title="サイトエイリアスの取得"
drush sa
```

このコマンドを実行すると、現在デプロイ済みの環境が取得されます（最新の状態は、`develop`ブランチにプッシュした時点のものと仮定します）:

```bash title="返されたサイトエイリアス"
[drupal-example]cli-drupal:/app$ drush sa
@develop
@self
default
```

これにより、ローカルデータベース(Drushではサイトエイリアス`@self`で表されます)とリモートデータベース(`@develop`)を同期することができます。

```bash title="Drush sql-sync"
drush sql-sync @self @develop
```

次のような結果が表示されるはずです:

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

さて、再度デプロイを試してみましょう。今度は空のプッシュです:

```bash title="Git push"
git commit --allow-empty -m "行け、行け！ パワーレンジャー！"
git push
```

今度はすべて正常に動作するはずです:

![デプロイ成功！](../../images/first_deployment_slack_success.jpg)

通知内のリンクをクリックすると、Drupalサイトがすべての機能を備えてロードされた状態を確認できます。おそらくまだ画像は表示されていませんが、それは[ステップ5](#5-synchronize-local-files-to-the-remote-lagoon-environment)で処理します。

デプロイが依然として失敗する場合は、詳細情報を確認するためにログリンクをクリックしてください。

## 5. ローカルファイルをリモートのLagoon環境に同期 { #5-synchronize-local-files-to-the-remote-lagoon-environment }

おそらく予想通りですが、Drushを使って同期できます:

```bash title="Drush rsync"
drush rsync @self:%files @develop:%files
```

次のような表示が出るはずです:

```bash title="Drush rsync results"
[drupal-example]cli-drupal:/app$ drush rsync @self:%files @develop:%files
You will delete files in drupal-example-develop@ssh.example.com:/app/web/sites/default/files and replace with data from /app/web/sites/default/files/
Do you really want to continue? (y/n): y
```

しかし、場合によっては、このように正しく表示されないこともある：

```bash title="Drush rsync results"
[drupal-example]cli-drupal:/app$ drush rsync @self:%files @develop:%files
You will delete files in drupal-example-develop@ssh.example.com:'/app/web/%files' and replace with data from '/app/web/%files'/
Do you really want to continue? (y/n):
```

この理由は、Drupalがファイルディレクトリのパスを解決できないためです。これはおそらく、Drupalが完全設定されていないか、データベースが存在しないことが原因です。回避策としては`drush rsync @self:sites/default/files @develop:sites/default/files`を使用できます。しかし、実際にはローカルとリモートの Drupal を確認することをお勧めします (`drush status`コマンドを使用して、ファイルディレクトリが正しく設定されているかどうかを確認できます)

## 6. 完了 { #6-its-done }

Lagoonがビルドとデプロイを完了すると、チャットシステムに次のような2回目の通知が送信されます。:

![完全なデプロイメントのSlack通知。](../../images/first_deployment_slack_2nd_success.jpg)

通知は次のような内容を示しています:

* デプロイされたプロジェクト
* デプロイされたブランチとGit SHA
* ビルドとデプロイのログへのリンク
* 環境にアクセスできるすべてのルート(URL)へのリンク

これで作業は完了です! DevOpsを簡単にできるようにすることが私たちの目標です。

## しかし、他のブランチや本番環境はどうなるのでしょうか？ { #but-wait-how-about-other-branches-or-the-production-environment }

Lagoonの優れた点は、まったく同じ方法で処理できることです。本番環境ブランチとして定義したブランチ名をプッシュすると、そのブランチがデプロイされます。

## デプロイの失敗 { #failure-dont-worry }

デプロイが失敗しましたか？ 心配しないでください。ヘルプを用意しています:

1. エラー通知内の `logs` リンクをクリックします。デプロイプロセスでどこで失敗したかがわかります。
2. 問題が解決できない場合は、Lagoon管理者に連絡してください。サポートいたします!

