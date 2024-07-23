# Varnish

DrupalをVarnishリバースプロキシと一緒に使用することをお勧めします。LagoonはVarnishがすでに設定済みの[Drupal Varnish config](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish-drupal/drupal.vcl)で`varnish-drupal`Dockerイメージを提供しています。

このVarnish configは以下のことを行います:

* Drupalのセッションクッキーを理解し、認証されたリクエストに対してVarnishのキャッシュを自動的に無効にします。
* この機能は、アセット(画像、CSS、JSなど)を自動的に 1 か月間キャッシュし、ブラウザにもキャッシュさせるためのヘッダーを送信します。これは認証されたリクエストでも認証されていないリクエストでも行われます。
* Drupal 8のパージモジュールで使用される`BAN`および`URIBAN`をサポートしています。
* Google Analyticsのリンクが複数のキャッシュオブジェクトを作成するのを防ぐために、URLパラメータから`utm_`と`gclid`を削除します。
* 他にも良いことがたくさんあります - [drupal.vcl](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish-drupal/drupal.vcl)をチェックしてみてください。

## Drupal 8との使用

**要約**: [examples repoのdrupal8-advanced example](https://github.com/uselagoon/lagoon-examples)をチェックしてください。必要なモジュールとDrupalの設定が用意されています。

**注意**:これらの例の多くは、同じ`drupal-example-simple`リポジトリ内の異なるブランチ/ハッシュに存在します。必ず、サンプルリストから正確なブランチを確認してください!

### PurgeとVarnish Purgeモジュールのインストール

Drupal 8のキャッシュタグでVarnishを完全に使用するには、[Purge](https://www.drupal.org/project/purge)と[Varnish Purge](https://www.drupal.org/project/varnish_purge)モジュールをインストールする必要があります。これらのモジュールには多くのサブモジュールが含まれています。少なくとも以下をインストールすることをお勧めします：

* `purge`
* `purge_drush`
* `purge_tokens`
* `purge_ui`
* `purge_processor_cron`
* `purge_processor_lateruntime`
* `purge_queuer_coretags`
* `varnish_purger`
* `varnish_purge_tags`

一度にすべてを取得します:

```bash title="PurgeとVarnish Purgeのインストール"
composer require drupal/purge drupal/varnish_purge

drush en purge purge_drush purge_tokens purge_ui purge_processor_cron purge_processor_lateruntime purge_queuer_coretags varnish_purger varnish_purge_tags
```

### Varnish Purgeの設定

1. `Configuration > Development > Performance > Purge`にアクセスします。
2. `Add purger`からパージを追加します。
3. `Varnish Bundled Purger`を選択します\(`Varnish Purger`ではありません。\#Behind the Scenesを参照してください\)
4. 追加したばかりのパージの横にあるドロップダウンをクリックし、`Configure`をクリックします。
5. わかりやすい名前をつけて下さい。`Lagoon Varnish` が良いでしょう。
6. 以下のように設定します:

   ```text title="Varnish Purgeの設定"
    TYPE: タグ

    REQUEST:
    ホスト名: varnish
    (またはdocker-compose.ymlでVarnishが呼ばれている名前)
    ポート: 8080
    パス: /
    リクエスト方法: BAN
    スキーム: http

    HEADERS:
    ヘッダー: Cache-Tags
    値: [invalidations:separated_pipe]
   ```

7. `Save configuration`設定を保存します。

以上で設定は完了です！ローカルでテストしたい場合は、次のセクションを読んでください。

### Varnish用のDrupalの設定

他にもいくつかの設定が可能です:

1. `drush pmu page_cache`を使用して`Internal Page Cache` Drupalモジュールをアンインストールします。このモジュールは、奇妙な二重キャッシュが発生する可能性があり、Varnish キャッシュのみがクリアされ、内部キャッシュがクリアされないため、変更がユーザーに非常に遅く反映されることがあります。また、大きなサイトではキャッシュストレージを大量に使用します。
2. `production.settings.php`内の`$config['system.performance']['cache']['page']['max_age']`を`2628000`に変更します。これにより、Varnish キャッシュはサイトを最大 1 ヶ月間キャッシュするように設定されます。一見長いように思われるかもしれませんが、Drupal 8 のキャッシュタグシステムは非常に優秀で、何らかの変更が行われると、Varnish キャッシュが自動的に更新されるようになっています。

### ローカルでの Varnish テスト

LagoonのローカルでのDrupalセットアップでは、開発作業の妨げになる可能性があるため、VarnishとDrupalのキャッシュはが無効化されています。無効化方法は以下の通りです:

* `docker-compose.yml`ファイル内の環境変数`VARNISH_BYPASS=true`により、Varnishに事実上無効化を指示しています。
* Drupal がキャッシュヘッダーを送信しないように設定されています\(開発環境ようの`development.settings.php`ファイル内のDrupal設定`$config['system.performance']['cache']['page']['max_age'] = 0`が設定されています\)

Varnishをローカルでテストするには、`docker-compose.yml`で以下の変更を行います:

* Varnishサービスセクションで`VARNISH_BYPASS`を`false`に設定します。
* `x-environment`セクションで`LAGOON_ENVIRONMENT_TYPE`を`production`に設定します。
* `docker-compose up -d`を実行します。これにより、新しい環境変数とともにすべてのサービスが再起動します。

これで、Varnishをテストできるようになるはずです！
<!-- markdown-link-check-disable -->
次に、IDが`1`でURLが`drupal-example.docker.amazee.io/node/1`となるノードを想定した短い例です。

1. `curl -I drupal-example.docker.amazee.io/node/1`を実行し、ヘッダーを確認してください:
   * `X-LAGOON` には `varnish` が含まれ、リクエストが実際にVarnishを通して処理されたことを示します。
   * Varnishはおそらくこのサイトを見たことがなく、最初のリクエストはVarnishのキャッシュをウォームアップするため、`Age:`は0のままです。
   * `X-Varnish-Cache` は `MISS` になっていれば、Varnishがこのリクエストのキャッシュ済みバージョンを見つけられなかったことを示します。
2. `curl -I drupal-example.docker.amazee.io/node/1` を再度実行すると、ヘッダーは以下のようになります:
   * `Age:` は、リクエストがキャッシュされてから何秒経ったかを示します。例えば、コマンドを実行する速度によりますが、おそらく1-30の間の値になるでしょう。
   * `X-Varnish-Cache` は `HIT` となり、Varnishがリクエストのキャッシュされたバージョンを正常に取得して、それを返したことを示しています。
3. Drupalの `node/1` のコンテンツ内容を変更します。
4. `curl -I drupal-example.docker.amazee.io/node/1` を実行すると、ヘッダーは最初のリクエストと同じになるはずです:
   * `Age:0`
   * `X-Varnish-Cache: MISS`
<!-- markdown-link-check-enable -->
### DrupalとVarnishの舞台裏

Drupal ホスティングを利用していた経験がある方や、Drupal 8 と Varnish のチュートリアルを以前に行ったことがある方は、Lagoon の Drupal Varnish チュートリアルにはいくつかの変更点があることに気づいたかもしれません。以下でそれらについて説明します:

#### `Varnish Purger`の代わりに`Varnish Bundled Purger`を使用する

`Varnish Purger`は、無効化する必要のあるキャッシュタグごとに`BAN`リクエストを送信します。Drupalには多くのキャッシュタグが存在するため、Varnishに大量のリクエストが送信される可能性があります。それに対して、`Varnish Bundled Purger`は、複数の無効化をパイプ(`|`)で区切って、1つの`BAN`リクエストのみ送信します。これは、Varnishのバン正規表現システムと適合しており、結果として少ないリクエストと、Varnish内のバンリストテーブルも小さくなります。

#### `Purge Late runtime processor`の使い方

Drupal 7のVarnishモジュールとは異なり、Drupal 8のPurgeモジュールはキャッシュの削除方法が少し異なります。Purgeモジュールは削除対象のキャッシュをキューに追加し、その後さまざまな処理者がキューを処理します。Purgeモジュールは`Cron processor`を使うことを推奨していますが、これは Varnish キャッシュがcronジョブの実行時のみ削除されることを意味します。通常のcronはおそらく1分ごとなど非常に頻繁には実行されないため、古いデータがVarnishキャッシュに残ってしまう可能性があり、編集者やクライアントが混乱する事態を引き起こすおそれがあります。

代わりに、私たちは`Purge Late runtime processor`の使用を推奨します。これは、各Drupalリクエストの終了時にキューを処理します。この利点は、キャッシュタグがパージキューに追加された場合 (編集者が Drupal ノードを編集した場合など)、そのノードのキャッシュタグが直接パージされることです。これと`Varnish Bundled Purger`を組み合わせることで、Drupalリクエストの最後だけにVarnishに対する単一の追加リクエストが行われるため、リクエスト処理時間に目立った影響はありません。

#### Varnish Ban Lurkerの完全なサポート

Varnishの設定では、`Ban Lurker`が完全にサポートされています。Ban Lurker は、キャッシュのクリーンアップと Varnish のスムーズな動作を維持するのに役立つツールです。Ban Lurkerは、Varnishの禁止リストにある項目をキャッシュ内のリクエストと比較する小さなツールです。Varnishの禁止機能は、キャッシュ内のオブジェクトを削除対象としてマークするために使用されます。Ban Lurkerは削除すべき項目を見つけると、キャッシュから削除し、禁止自体も解除します。これにより、通常は禁止されずにずっとキャッシュ容量を占有し続ける、アクセス頻度が低く有効期限が非常に長いオブジェクトが削除され、更新されるようになります。これにより、禁止リストが小さくなり、Varnishの各リクエストに対する処理時間も短縮されます。詳細については、[Ban LurkerのVarnishの公式記事](https://info.varnish-software.com/blog/ban-lurker)や、その他の[参考になる記事](https://www.randonomicon.com/varnish/2018/09/19/banlurker.html)を参照ください。

### トラブルシューティング

Varnishがキャッシュしていない？ それとも何か他の問題が？ 以下にデバッグの方法をいくつか紹介します:
<!-- markdown-link-check-disable -->
* purgeモジュールのデバッグログを有効にするには、`drush p-debug-en`コマンドを実行します。デバッグ情報は、Drupalログ`admin/reports/dblog`で確認できます。
* Drupalが適切なキャッシュヘッダーを送信していることを確認してください。最適なテスト方法としては、Lagoonが生成するVarnishキャッシュをバイパスするためのURLを使用します(ローカルのDrupalの例では、[http://nginx-drupal-example.docker.amazee.io](http://nginx-drupal-example.docker.amazee.io)になります)。`Cache-Control: max-age=900, public`ヘッダーをチェックし、`900`が`$config['system.performance']['cache']['page']['max_age']`で設定したものであることを確認します。
* 環境変数`VARNISH_BYPASS`が`true`に設定されて**いない**ことを確認してください(`docker-compose.yml`を確認し、`docker-compose up -d varnish`を実行して環境変数が正しく設定されていることを確認してください)。
* すべてが上手くいかない場合、テーブルをひっくり返す前に \(╯°□°)╯︵ ┻━┻、Lagoonチームに問い合わせください。喜んでお手伝いします。
<!-- markdown-link-check-enable -->
