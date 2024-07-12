# サブフォルダ

例えば、`www.example.com`はあるDrupalサイトへのアクセスを提供し、`www.example.com/blog`は別のDrupalで構築されたブログを読み込みます。

この場合、両方のDrupalを単一のGitリポジトリで管理し、まとめてデプロイすることも可能です。しかし、このワークフローは全てのチームに適しているわけではなく、状況によっては別々のGitリポジトリを使用した方が良い場合もあります。



## ルートアプリケーションの変更

ルートアプリケーション(この例では`www.example.com`のDrupalサイト)は、NGINXをサブフォルダアプリケーションへのリバースプロキシとして設定するためのNGINX設定ファイルがいくつか必要になります:

### `location_prepend.conf`

Drupalインストールのルートに`location_prepend.conf`というファイルを作成します:

```text title="location_prepend.conf"
resolver 8.8.8.8 valid=30s;

location ~ ^/subfolder {
  # $http_x_forwarded_protoが空の場合 (上流のリバースプロキシから設定されていない場合)
  # 現在のスキームに設定します。
  set_if_empty $http_x_forwarded_proto $scheme;

  proxy_set_header      X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header      X-Forwarded-Proto $scheme;
  proxy_set_header      X-Forwarded-Proto $http_x_forwarded_proto;
  proxy_set_header      X-Lagoon-Forwarded-Host $ ホスト;
  # 元のホストを下流が知るために使用されます。
  proxy_set_header      X-REVERSEPROXY $hostname;
  proxy_set_header      FORWARDED "";
  # Drupal 8でエラーが発生するため、FORWARDEDヘッダーを削除します。
  proxy_set_header      Proxy "";
  # Drupal 8でエラーが発生するため、Proxyヘッダーを削除します。
  proxy_ssl_server_name on;

  # NGINXでDNS解決を正しく動作させるには、変数を設定する必要があります。
  set                   $subfolder_drupal_host "https://nginx-lagoonproject-${LAGOON_GIT_SAFE_BRANCH}.clustername.com:443";
  # LAGOON_GIT_SAFE_BRANCH変数はdockerエントリーポイント時に置換されます。
  proxy_pass            $subfolder_drupal_host;
  proxy_set_header      Host $proxy_host;
  # $proxy_hostは、NGINXがproxy_passディレクティブ(スキームとポートを除くホスト名)を元に自動生成されます。

  expires off; # プロキシからのキャッシュヘッダーを尊重し、上書きしないようにします
```

以下の文字列を置換してください:

* `/subfolder`：サブフォルダとして使用する名前を入力してください例えば、`/blog`。
* `nginx`：サブフォルダプロジェクトが参照するサービス名を入力してください。
* `lagoonproject`：サブフォルダプロジェクトのLagoonプロジェクト名を入力してください。

### N GINX Dockerfile

以下の内容をNGINX Dockerfile(`nginx.dockerfile`または`Dockerfile.nginx`)に追加してください:

```text title="nginx.dockerfile"
COPY location_prepend.conf /etc/nginx/conf.d/drupal/location_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/*
```

## サブフォルダアプリケーションの変更

ルートアプリケーションと同様に、サブフォルダアプリケーション(この例では、`www.example.com/blog`のDrupalインストール)に対しても、サブフォルダで動作していることを認識させる必要があります。そのためには、以下の2つのファイルを作成します:

### `location_drupal_append_subfolder.conf`

サブフォルダアプリケーションのDrupalインストールのルートディレクトリに、`location_drupal_append_subfolder.conf`という名前のファイルを作成します:

```text title="location_drupal_append_subfolder.conf"
# Drupalは、`subfolder`で始まるプレフィックスが付いたスクリプト名を注入すると、
# すべてのURLに`subfolder`をプレフィックスとして付加してレンダリングします。
fastcgi_param  SCRIPT_NAME        /subfolder/index.php;

# リバースプロキシ経由で実行している場合、オリジナルのHOST URLを
# PHPに注入します。これにより、Drupalは現在のHOSTではなく、
# オリジナルのHOST URLを用いてすべての URL をレンダリングします。

# 最初に、HOSTを通常のホスト変数に設定します。
fastcgi_param  HTTP_HOST          $http
``` _host;
# それが存在する場合は、`X-Lagoon-Forwarded-Host`で上書きします。
fastcgi_param  HTTP_HOST          $http_x_lagoon_forwarded_host if_not_empty;
```

サブフォルダー名で `/subfolder`を置き換えてください。例えば、`/blog`のように置き換えます。

### `server_prepend_subfolder.conf`

サブフォルダーでのDrupalインストールのルートディレクトリに、`server_prepend_subfolder.conf`という名前のファイルを作成してください:

```text title="server_prepend_subfolder.conf"
# 内部NGINXリライトは`last`フラグを使うため、
# リライトの前にリダイレクトの有無を確認します。
# `last`フフラグはNGINXに対して、これ以降のリライト処理を行わないよう指示します。
# (また、`if`はリダイレクトモジュールの一部です。)
include /etc/nginx/helpers/010_redirects.conf;

# このリライトはリクエストURLから`/subfolder/`を削除し、
# あたかも最初から`/`であったかのようにNGINXが
# 処理できるようにします。
# `last`フラグも重要です。
# これにより、以下のリライトが永続的に繰り返されるのを防ぎます。
rewrite ^/subfolder/(.*)          /$1             last;

# NGINXによって現在処理されているホスト情報が上書きされないよう、
# リダイレクトの絶対パスを使用しないようにします。
absolute_redirect off;

# `/subfolder`だけがリクエストされた場合、301リダイレクトで
# `/subfolder`(Drupalは末尾のスラッシュを好みます)に転送します。
rewrite ^/subfolder               /subfolder/     permanent;

# その他のリクエストに対しては、301リダイレクトのパスに`/subfolder/`を先頭に追加します。
rewrite ^\/(.*)                   /subfolder/$1   permanent;
```

`/subfolder`は、使用するサブフォルダーの名前と置き換えてください。例えば、ブログ用のサブフォルダーであれば `/blog`となります。

### NGINX Dockerfile

NGINX Dockerfileも編集が必要です。

NGINX Dockerfile(通常は`nginx.dockerfile` または `Dockerfile.nginx`)に以下の内容を追加してください:

```text title="nginx.dockerfile"
COPY location_drupal_append_subfolder.conf /etc/nginx/conf.d/drupal/location_drupal_append_subfolder.conf
COPY server_prepend_subfolder.conf /etc/nginx/conf.d/drupal/server_prepend_subfolder.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/*
```

