# DrupalとFastlyの統合

## 前提条件

* Drupal 7以降
* FastlyサービスID
* パージ権限を持つFastly APIトークン

## Drupal 7でのURLベースのパージ

1. [Fastly Drupalモジュール](https://www.drupal.org/project/fastly)をダウンロードしてインストールします。
2. FastlyサービスIDとAPIトークンを設定します。
3. 必要に応じてWebhooksを設定します(例えば、キャッシュパージが送信されたときにSlackに通知するなど)。
4. Drupal 7ではURLベースのパージ(簡易パージ)のみが可能です。
5. `settings.php`でDrupalのクライアントIPを変更します:

```php title="Drupal 7のためのsettings.phpの変更"
$conf['reverse_proxy_header'] = 'HTTP_TRUE_CLIENT_IP';
```

## Drupal 10以降でのキャッシュタグパージ

Composerを使って最新バージョンのモジュールを取得します:

```bash title="Fastly Drupalモジュールと依存関係のダウンロード"
composer require drupal/fastly drupal/http_cache_control drupal/purge
```

次のモジュールを有効化する必要があります:

* `fastly`
* `fastlypurger`
* `http_cache_control` (2.x)
* `purge`
* `purge_ui` (技術的には必須ではありませんが、本番環境で有効にすると非常に便利です)
* `purge_processor_lateruntime`
* `purge_processor_cron`
* `purge_queuer_coretags`
* `purge_drush` (Drushを使ったパージに便利です。こちらに[コマンドのリスト](https://git.drupalcode.org/project/purge/-/blob/8.x-3.x/README.md#drush-commands)があります)

### DrupalでFastlyモジュールを設定します

FastlyサービスIDとAPIトークンを設定します。サイトIDは自動的に生成されます。実行時環境変数を利用するか、`/admin/config/services/fastly`にある設定フォームを編集できます:

* `FASTLY_API_TOKEN`
* `FASTLY_API_SERVICE`

#### パージオプションの設定

* キャッシュタグハッシュ長: 4文字
* パージ方式: ソフトパージを使用

ほとんどのサイトでは`4`文字のキャッシュタグで十分ですが、数百万のエンティティを持つサイトでは、キャッシュタグの衝突を減らすために`5`文字の方が良いでしょう。

!!! Note "注意:"
    ソフトパージを使用してください。Fastly内のオブジェクトは古くなったとマークされ、完全に削除されるわけではないので、オリジンがダウンしている場合にも使用することができます([古くなったものを提供する](https://developer.fastly.com/solutions/tutorials/stale/)機能を使用した場合)

![パージング用のFastly管理UI。キャッシュタグの長さとソフトパージの使用に関する設定オプションを示しています](../images/fastly-cachetag.png)

#### 古いコンテンツのオプションの設定

サイトに適したオプションを設定してください。最小1時間(` 3600`)、最大1週間(`604800`)です。以下のような設定が一般的です:

1. 再検証時にステール - オン、`14440`秒
2. エラー時にステール - オン、`604800`秒

![Fastly管理者UIのステール設定](../images/fastly-swr.png)

必要に応じてWebhookを設定することもできます(たとえば、キャッシュパージが送信されたときにSlackに通知を送るなど)

![Fastly管理者UIのウェブフック設定](../images/fastly-webhook.png)

### Purgeモジュールの設定

パージページ`/admin/config/development/performance/purge`にアクセスします。

以下のオプションを設定します:

#### キャッシュ無効化

* Drupal Origin: タグ
* Fastly: E、タグ、URL

![パージ管理者UIのパージャー設定](../images/fastly-invalidate.png)

#### キュー

* キューワー:コアタグキューワー、パージブロック(複数可)
* キュー:データベース
* プロセッサ:コアプロセッサ、レイトランタイムプロセッサ、パージブロック(複数可)

![パージ管理者UIのキュー設定](../images/fastly-queue.png)

これは、Drupalの組み込みのコアタグキューワーを使用してキューにタグを追加し、キューはデータベースに保存され (デフォルト)、以下のプロセッサによって処理されることを意味します。

* Cronプロセッサ
* レイトランタイムプロセッサ

cronプロセッサを実行するには、サイトでcronが実行されていることを確認する必要があります (理想的には1分ごと)。`cli`ポッドでcronを手動実行して、`purge_processor_cron_cron()`がエラーなく実行されていることを確認してください。

```bash title="cronの開始"
[drupal8]production@cli-drupal:/app$ drush cron -v
...
[notice] purge_processor_cron_cron()の実行を開始、node_cron()の実行は21.16msかかりました。
```

レイアウトパージは、ページロードごとにhook_exit()で実行される`Late runtime processor`によって処理されます。これにより、パージ要求がキューに追加されるとほぼ同時に処理することができ、非常に便利です。

両方の方式を併用することで、パージが可能な限り迅速に実行されることが保証されます。

### 最適なキャッシュヘッダー設定

Drupalは標準設定では、ブラウザとFastlyで異なるキャッシュ有効期限を設定する機能がありません。そのため、Drupalで長いキャッシュ有効期限を設定しても、ブラウザが既にページをキャッシュしている場合、ユーザーは変更を確認できません。[HTTP Cache Control](https://www.drupal.org/project/http_cache_control)モジュールの`2.x`バージョンをインストールすると、さまざまなキャッシュに対して、より詳細な有効期限設定が可能になります。

ほとんどのサイトでは、以下のような設定が妥当なデフォルト値になるでしょう。

* 共有キャッシュ最大有効期限: 1ヶ月
* ブラウザキャッシュ最大有効期限: 10分
* 404 エラーキャッシュ最大有効期限: 15分
* 302 リダイレクトキャッシュ最大有効期限: 1時間
* 301 リダイレクトキャッシュ最大有効期限: 1時間
* 5xx エラーキャッシュ最大有効期限: キャッシュしない

!!! Note "注意:"
    この設定は、サイト上のすべてのコンテンツに対して適切なキャッシュタグが設定されていることを前提としています。

### 実際のクライアントIP

Fastlyは、実際クライアントのIPアドレスを`True-Client-IP`HTTPヘッダーで返送するように設定されています。`settings.php`で以下の変更を行うことで、Drupalがこのヘッダーを尊重するように設定することができます:

```php title="Drupal < 8.7.0用のsettings.phpの変更"
$settings['reverse_proxy'] = TRUE;
$settings['reverse_proxy_header'] = 'HTTP_TRUE_CLIENT_IP';
```

しかし、Drupal 8.7.0では、[この機能が削除されました](https://www.drupal.org/node/3030558)。以下のコードスニペットで同様の動作を実現できます。

```php title="Drupal >= 8.7.0用のsettings.phpの変更"
/**
 * DrupalにTrue-Client-IP HTTPヘッダーを使用するよう指示します。
 */
if (isset($_SERVER['HTTP_TRUE_CLIENT_IP'])) {
  $_SERVER['REMOTE_ADDR'] = $_SERVER['HTTP_TRUE_CLIENT_IP'];
}
```

### Drush統合

```php title="settings.php"
 fastly:
   fastly:purge:all (fpall)                                                    サービス全体をパージ
   fastly:purge:key (fpkey)                                                    キーでキャッシュをパージ
   fastly:purge:url (fpurl)                                                    URLでキャッシュをパージ

## cURLを使用してFastlyキャッシュヘッダーを表示する

以下の関数を使用してください:(LinuxとMac OSXで動作します)

```bash title="cURL function"
function curlf() { curl -sLIXGET -H 'Fastly-Debug:1' "$@" | grep -iE 'X-Cache|Cache-Control|Set-Cookie|X-Varnish|X-Hits|Vary|Fastly-Debug|X-Served|surrogate-control|surrogate-key' }
```

```bash title="Using cURL"
$ curlf https://www.example-site-fastly.com
cache-control: max-age=601, public, s-maxage=2764800
surrogate-control: max-age=2764800, public, stale-while-revalidate=3600, stale-if-error=3600
fastly-debug-path: (D cache-wlg10427-WLG 1612906144) (F cache-wlg10426-WLG 1612906141) (D cache-fra19179-FRA 1612906141) (F cache-fra19122-FRA 1612906141)
fastly-debug-ttl: (H cache-wlg10427-WLG - - 3) (M cache-fra19179-FRA - - 0)
fastly-debug-digest: 1118d9fefc8a514ca49d49cb6ece04649e1acf1663398212650bb462ba84c381
x-served-by: cache-fra19179-FRA, cache-wlg10427-WLG
x-cache: MISS, HIT
x-cache-hits: 0, 1
vary: Cookie, Accept-Encoding
```

上記のヘッダーから、以下の情報が確認できます:

* HTMLページはキャッシュ可能
* ブラウザはページを601秒間キャッシュします
* Fastlyはページを32日間(`2764800`秒)キャッシュします
* 階層型キャッシュが有効(WellingtonのエッジPoP、フランスのシールドPoP)
* HTMLページはエッジPoPでキャッシュヒットしました

### Fastlyに手動でパージリクエストを送信する

特定のページを手動でキャッシュから削除したい場合、いくつかの方法があります。

```bash title="単一のURLでFastlyをパージ"
curl -Ssi -XPURGE -H 'Fastly-Soft-Purge:1' -H "Fastly-Key:$FASTLY_API_TOKEN" https://www.example.com/subpage
```

キャッシュタグを指定してパージすることもできます:

```bash title="キャッシュタグでFastlyをパージ"
curl -XPOST -H 'Fastly-Soft-Purge:1' -H "Fastly-Key:$FASTLY_API_TOKEN" https://api.fastly.com/service/$FASTLY_API_SERVICE/purge/<surrogatekey>
```

[Fastly CLI](https://github.com/fastly/cli)を使用すると、より簡単にパージを行うことができます。
