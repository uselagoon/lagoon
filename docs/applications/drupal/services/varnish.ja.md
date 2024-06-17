# バニッシュ

Drupalをバニッシュリバースプロキシと一緒に使用することをお勧めします。Lagoonは既にバニッシュが設定されている`varnish-drupal` Dockerイメージを提供しています。[Drupal Varnish config](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish-drupal/drupal.vcl)付きです。

このバニッシュ設定は以下のことを行います：

* Drupalのセッションクッキーを理解し、認証されたリクエストのバニッシュキャッシュを自動的に無効にします。
* アセット（画像、CSS、JSなど）を1ヶ月間自動的にキャッシュし、このヘッダーもブラウザに送信します。これにより、ブラウザもアセットをキャッシュします。これは認証されたリクエストと認証されていないリクエストの両方で発生します。
* Drupal 8のパージモジュールで使用される`BAN`および`URIBAN`をサポートしています。
* URLパラメータから`utm_`と`gclid`を削除し、Google Analyticsのリンクが複数のキャッシュオブジェクトを生成するのを防ぎます。
* その他の多くの良い点 - [drupal.vcl](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish-drupal/drupal.vcl)をチェックしてみてください。

## Drupal 8との使用

**要約**: [我々の例のレポジトリでdrupal8-advancedの例をチェックしてみてください](https://github.com/uselagoon/lagoon-examples)、それは必要なモジュールと必要なものを含んでいます。 Drupalの設定。

**注意**：これらの例の多くは、同じ`drupal-example-simple`リポジトリ内の異なるブランチ/ハッシュに存在します。例のリストから正確なブランチを取得してください！

### PurgeとVarnish Purgeモジュールのインストール

Drupal 8のキャッシュタグとVarnishを完全に使用するためには、[Purge](https://www.drupal.org/project/purge)と[Varnish Purge](https://www.drupal.org/project/varnish_purge)モジュールをインストールする必要があります。これらは多くのサブモジュールと共に提供されています。最低限以下のものをインストールすることをお勧めします：

* `purge`
* `purge_drush`
* `purge_tokens`
* `purge_ui`
* `purge_processor_cron`
* `purge_processor_lateruntime`
* `purge_queuer_coretags`
* `varnish_purger`
* `varnish_purge_tags`

一度にすべてを取得します：

```bash title="PurgeとVarnish Purgeのインストール"
composer require drupal/purge drupal/varnish_purge

drush en purge purge_drush purge_tokens purge_ui purge_processor_cron purge_processor_lateruntime purge_queuer_coretags varnish_purger varnish_purge_tags
```

### Varnish Purgeの設定

1. `Configuration > Development > Performance > Purge`にアクセスします。
2. `Add purger`でパージャーを追加します。
3. `Varnish Bundled Purger`を選択します（`Varnish Purger`ではなく、\#Behind the Scenesを参照してください）。 セクション、詳細情報については。\).
4. 追加したばかりのパージャーの隣にあるドロップダウンをクリックし、`Configure`をクリックします。
5. 良い名前をつけてください、`Lagoon Varnish` が良いでしょう。
6. 以下のように設定します：

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

7. `設定を保存`。

以上で終わりです！これをローカルでテストしたい場合は、次のセクションを読んでください。

### Varnish用のDrupalの設定

その他にもいくつかの設定が可能です：

1. `drush pmu page_cache`を使用して`Internal Page Cache` Drupalモジュールをアンインストールします。これによりVarnishキャッシュのみがクリアされ、内部キャッシュはクリアされず、変更がユーザーに非常に遅く表示されるなど、奇妙な二重キャッシュ状況が発生することがあります。また、大きなサイトではキャッシュストレージを大量に使用します。
2. `production.settings.php`内の`$config['system.performance']['cache']['page']['max_age']`を`2628000`に変更します。これにより、Varnishはサイトを最大1ヶ月間キャッシュするように指示されますが、これは多くのように聞こえますが、Drupal 8 キャッシュタグシステムは基本的に何かが変更されるたびにVarnishキャッシュがパージされるようにするので、とても素晴らしいです。

### Varnishをローカルでテストする

LagoonのローカルでのDrupalセットアップでは、開発が困難になる可能性があるため、VarnishとDrupalのキャッシュは無効になっています。これは次のように行われます：

* `docker-compose.yml`の環境変数`VARNISH_BYPASS=true`は、Varnishに基本的に自己無効化を指示します。
* Drupalは、`development.settings.php`のDrupal設定`$config['system.performance']['cache']['page']['max_age'] = 0`を設定することで、キャッシュヘッダーを送信しないように設定されています。

ローカルでVarnishをテストするには、`docker-compose.yml`で以下の変更を行います：

* Varnishサービスセクションで`VARNISH_BYPASS`を`false`に設定します。
* `x-environment`セクションで`LAGOON_ENVIRONMENT_TYPE`を`production`に設定します。
* `docker-compose up -d`を実行します。これにより、新しい環境変数ですべてのサービスが再起動します。

これで、Varnishをテストできるようになるはずです！
<!-- markdown-link-check-disable -->
次に、IDが`1`でURLが`drupal-example.docker.amazee.io/node/1`となるノードがあると仮定した短い例を示します。

1. `curl -I drupal-example.docker.amazee.io/node/1`を実行し、見てみてください。 これらのヘッダーについて:
   * `X-LAGOON` には `varnish` が含まれ、要求が実際にVarnishを経由したことを示します。
   * `Age:` は、Varnishがこのサイトを初めて見ることはおそらくないため、最初のリクエストがVarnishのキャッシュを温めるでしょう。
   * `X-Varnish-Cache` は `MISS` となり、Varnishがこのリクエストの以前にキャッシュされたバージョンを見つけられなかったことを示します。
2. `curl -I drupal-example.docker.amazee.io/node/1` を再度実行し、ヘッダーは次のようになります:
   * `Age:` は、リクエストがキャッシュされてから何秒経ったかを示します。例えば、コマンドを実行する速度によりますが、1-30の間でしょう。
   * `X-Varnish-Cache` は `HIT` となり、Varnishがリクエストのキャッシュされたバージョンを正常に見つけ、それを返したことを示します。
3. Drupalの `node/1` の内容を変更します。
4. `curl -I drupal-example.docker.amazee.io/node/1` を実行し、ヘッダーは最初のリクエストと同じになるべきです:
   * `Age:0`
   * `X-Varnish-Cache: MISS`
<!-- markdown-link-check-enable -->
### Varnish on Drupal の裏側

他のDrupalホストから来ているか、以前にDrupal 8 & Varnishのチュートリアルを経験している場合、あなたは気付いたかもしれません。 Lagoon Drupal Varnishチュートリアルにいくつかの変更があります。それらについて説明しましょう:

#### `Varnish Purger`の代わりに`Varnish Bundled Purger`の使用

`Varnish Purger`は、無効化する必要がある各キャッシュタグに対して`BAN`リクエストを送信します。Drupalには多数のキャッシュタグが存在し、これによりVarnishに送信されるリクエスト数がかなり多くなる可能性があります。それに対して、`Varnish Bundled Purger`は、複数の無効化に対して一つの`BAN`リクエストを送信します。これはパイプ（`|`）できれいに分離されており、Varnishのバンの正規表現システムに完璧にマッチします。これにより、Varnishへのリクエスト数が減少し、Varnish内のバンリストテーブルも小さくなります。

#### `Purge Late runtime processor`の使用

Drupal 7のVarnishモジュールとは異なり、Drupal 8のPurgeモジュールはキャッシュのパージに若干異なるアプローチを持っています: パージするキャッシュをキューに追加し、それを異なるプロセッサで処理します。Purgeは`Cron processor`の使用を提案していますが、これはVarnishキャッシュがcron実行時にのみパージされることを意味します。これは、cronがおそらく毎分実行するように設定されていないため、Varnishが古いデータをキャッシュする可能性があり、編集者やクライアントが混乱する結果となる可能性があります。

その代わりに、`Purge `Late runtime processor`は、各Drupalリクエストの最後にキューを処理します。これにより、キャッシュタグがパージキューに追加されると（例えば、エディタがDrupalノードを編集した場合など）、そのノードのキャッシュタグが直接パージされるという利点があります。`Varnish Bundled Purger`と一緒に使用することで、Drupalリクエストの最後にVarnishへの追加のリクエストは1つだけで、リクエストの処理時間にはほとんど影響しません。

#### Varnish Ban Lurkerの完全なサポート

私たちのVarnish設定は、`Ban Lurker`の完全なサポートを提供しています。Ban Lurkerは、キャッシュをきれいに保ち、Varnishをスムーズに動作させるのに役立ちます。基本的には、Varnishの禁止リストを走査し、それらをVarnishキャッシュ内のキャッシュされたリクエストと比較する小さなツールです。Varnishの禁止は、キャッシュ内のオブジェクトをパージするために使用されます。Ban Lurkerが"禁止"されるべきアイテムを見つけると、それらをキャッシュから削除し、禁止自体も削除します。これにより、通常は禁止されずにキャッシュスペースを占め続ける、アクセスが少なくTTLが非常に長いオブジェクトが削除され、更新できるようになります。これにより、禁止リストが小さくなり、それによって、Varnの処理時間も少なくなります。 それぞれのリクエストでのVarnishの動作については、[公式VarnishのBan Lurkerについての投稿](https://info.varnish-software.com/blog/ban-lurker)や、その他の[参考になる読み物](https://www.randonomicon.com/varnish/2018/09/19/banlurker.html)をご覧ください。

### トラブルシューティング

Varnishがキャッシュしていない？ それとも何か他の問題がありますか？ 以下にデバッグの方法をいくつか紹介します：
<!-- markdown-link-check-disable -->
* `drush p-debug-en`を実行して、purgeモジュールのデバッグログを有効にします。これにより、Drupalのログの`admin/reports/dblog`でデバッグを表示できます。
* Drupalが適切なキャッシュヘッダーを送信していることを確認してください。これを最もよくテストするためには、LagoonがVarnishキャッシュをバイパスするために生成したURLを使用します（私たちのDrupalの例では、これは[http://nginx-drupal-example.docker.amazee.io](http://nginx-drupal-example.docker.amazee.io)です）。`Cache-Control: max-age=900, public`ヘッダーをチェックし、`900`が`$config['system.performance']['cache']['page']['max_age']`で設定したものであることを確認します。
* 環境変数`VARNISH_BYPASS`が`true`に設定されて**いない**ことを確認してください（`docker-compose.yml`を参照し、`docker-compose up -d varnish`を実行して環境変数が正しく設定されていることを確認します）。
* もし全部 失敗すると、テーブルをひっくり返す前に \(╯°□°）╯︵ ┻━┻、ラグーンチームに話してみてください、私たちは喜んでお手伝いします。
<!-- markdown-link-check-enable -->