# NGINX-Drupal

[Lagoonの`nginx-drupal` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx-drupal/Dockerfile)。Drupalと連携するように最適化されています。[Lagoonの`nginx`イメージ](../../../docker-images/nginx.md)に基づいています。

## Lagoonの適応 { #lagoon-adaptions }

このイメージは、Lagoonで使用するために準備されています。したがって、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `drupal.conf`の設定ファイルをできるだけクリーンでカスタマイズ可能に保つために、ファイルの主要なセクション(`server`、`location /`、`location @drupal`、`location @php`)に`include`指示を追加しました。
* [`Drupal.conf`カスタマイズ](#drupalconf-customization)のセクションでさらなる情報を提供します。

## 含まれるDrupal設定 - `drupal.conf`{ #included-drupal-configuration-drupalconf }

このイメージには、Drupal 7, 8, 9の完全なNGINX作業設定が含まれています。いくつかの追加機能も含まれています:

* [`humanstxt` Drupalモジュール](https://www.drupal.org/project/humanstxt)のサポート。
* [`robotstxt` Drupalモジュール](https://www.drupal.org/project/ robotstxt)。
* ローカル開発用の`vagrant`ディレクトリへのアクセスを禁止します。

## `Drupal.conf`のカスタマイズ { #drupalconf-customization }

`drupal.conf`ファイルは、Drupal用に最適化された`nginx`設定ファイルのカスタマイズ版です。顧客はそれをカスタマイズするための異なる方法を持っています:

* _それを修正する_ \(エラーの場合、サポートが困難\)。
* `*.conf`ファイルを通じた組み込みのカスタマイズを使用。

`drupal.conf`ファイルはいくつかのセクションに分割されています。私たちがカスタマイズに含めたセクションは次の通りです:

* `server`
* `location /`
* `location @drupal`
* `location @php`.

各セクションには**二つ**のインクルードがあります:

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

この設定は、顧客が`location_drupal_prepend.conf`および` `location_drupal_append.conf`、ここに他のステートメントの前後に挿入したい設定をすべて置くことができます。

これらのファイルは作成されたら、`nginx`コンテナ内に**必ず**存在していなければならず、それらを`Dockerfile.nginx`に以下のように追加します:

```bash title="dockerfile.nginx"
COPY location_drupal_prepend.conf /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_drupal_prepend.conf
```

## Drupal Core Statisticsモジュールの設定 { #drupal-core-statistics-module-configuration }

コアのStatisticsモジュールを使用している場合、短時間で設定の変更が必要な問題に遭遇するかもしれません。

デフォルトのNGINX設定では、トラッキングエンドポイント`/core/modules/statistics/statistics.php`へのリクエストが拒否され(404)ます。

これはデフォルトのNGINX設定に関連しています:

```text title="drupal.conf"
location ~* ^.+\.php$ {
    try_files /dev/null @drupal;
}
```

この問題を解決するために、特定のロケーションルールを定義し、これをロケーションの前置設定として注入します:

```text title="drupal.conf"
## Allow access to to the statistics endpoint.
location ~* ^(/core/modules/statistics/statistics.php) {
      try_files /dev/null @php;
}
```

そして、これをNGINの間にコピーします Xコンテナービルド:

```text title="dockerfile.nginx"
# Drupal統計モジュールの特定のNGINX設定を追加します。
COPY .lagoon/nginx/location_prepend_allow_statistics.conf /etc/nginx/conf.d/drupal/location_prepend_allow_statistics.conf
```
