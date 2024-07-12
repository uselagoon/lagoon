# NGINX

[Lagoonの`nginx-drupal` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx-drupal/Dockerfile)。Drupalと連携するように最適化されています。[Lagoonの`nginx`イメージ](../../../docker-images/nginx.md)に基づいています。

## Lagoonの適応 { #lagoon-adaptions }

このイメージは、Lagoonで使用するために準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `drupal.conf`の設定ファイルをできるだけシンプルで、カスタマイズしやすいようにするために、ファイルのメインセクション(`server`、`location /`、`location @drupal`、`location @php`)に`include`指示を追加しました。
* [`Drupal.conf`カスタマイズ](#drupalconf-customization)のセクションでさらなる情報を提供します。

## 含まれるDrupal設定 - `drupal.conf`{ #included-drupal-configuration-drupalconf }

このイメージには、Drupal 7, 8, 9の完全なNGINX動作設定が含まれています。以下のような追加機能も含まれています:

* [`humanstxt` Drupalモジュール](https://www.drupal.org/project/humanstxt)のサポート
* [`robotstxt` Drupalモジュール](https://www.drupal.org/project/ robotstxt)
* ローカル開発用の`vagrant`ディレクトリへのアクセスを禁止します。

## `Drupal.conf`のカスタマイズ { #drupalconf-customization }

`drupal.conf`ファイルは、`nginx`設定ファイルをDrupal用にカスタマイズしたものです。顧客によってカスタマイズ方法は様々です:

* 修正が困難 \(エラーが発生した場合のサポートが難しい \)
* `*.conf`ファイルを使用した組み込みのカスタマイズ

`drupal.conf`ファイルはいくつかのセクションに分かれています。私たちがカスタマイズに含めたセクションは以下の通りです:

* `server`
* `location /`
* `location @drupal`
* `location @php`.

このセクションには、それぞれ2つのインクルードがあります:

* `*_prepend.conf`
* `*_append.conf`

`location @drupal`セクションは以下のようになります:

```bash title="drupal.conf"
location @drupal {
    include /etc/nginx/conf.d/drupal/location_drupal_prepend*.conf;

    include        /etc/nginx/fastcgi.conf;
    fastcgi_param  SCRIPT_NAME        /index.php;
    fastcgi_param  SCRIPT_FILENAME    $realpath_root/index.php;
    fastcgi_pass   ${NGINX_FASTCGI_PASS:-php}:9000;

    include /etc/nginx/conf.d/drupal/location_drupal_append*.conf;
}
```

この設定は、お客さまが`location_drupal_prepend.conf`および`location_drupal_append.conf`という名前のファイルを作成することを許可します。これらのファイルには、他のステートメントの前に挿入したい設定と、後に挿入したい設定をすべて記述することができます。

これらのファイルは一度作成されると、`nginx`コンテナ内に**必ず**存在しなければならないので、`Dockerfile.nginx`に以下のように追加します:

```bash title="dockerfile.nginx"
COPY location_drupal_prepend.conf /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
```

## Drupal Core Statisticsモジュールの設定 { #drupal-core-statistics-module-configuration }

コアのStatisticsモジュールを使用している場合、簡単な設定変更が必要になるかもしれません。

デフォルトのNGINX設定では、トラッキングエンドポイント`/core/modules/statistics/statistics.php`へのリクエストが拒否されます(404)

これはデフォルトのNGINX設定に関連しています:

```text title="drupal.conf"
location ~* ^.+\.php$ {
    try_files /dev/null @drupal;
}
```

この問題を解決するために、特定のロケーションルールを定義し、これをロケーションのプリペンド設定として注入します:

```text title="drupal.conf"
## Allow access to to the statistics endpoint.
location ~* ^(/core/modules/statistics/statistics.php) {
      try_files /dev/null @php;
}
```

NGINXコンテナのビルド時にこのファイルをコピーします。

```text title="dockerfile.nginx"
# Drupal StatisticsモジュールのNGINX設定を追加する
COPY .lagoon/nginx/location_prepend_allow_statistics.conf /etc/nginx/conf.d/drupal/location_prepend_allow_statistics.conf
```
