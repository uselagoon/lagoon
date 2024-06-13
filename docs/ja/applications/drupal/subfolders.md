# サブフォルダ

例えば、`www.example.com`が一つのDrupalサイトを指し、`www.example.com/blog`が別のDrupalで作られたブログをロードする場合があります。

両方のDrupalを1つのGitリポジトリで動かし、それを全体としてデプロイすることが可能ですが、このワークフローはすべてのチームに適合するわけではなく、別々のGitリポジトリを持つことが一部の状況にはより適しています。

## ルートアプリケーションの修正

ルートアプリケーション（この例では`www.example.com`のDrupalサイト）は、NGINXをサブフォルダアプリケーションへのリバースプロキシとして構成するいくつかのNGINX設定が必要です：

### `location_prepend.conf`

Drupalインストールのルートに`location_prepend.conf`というファイルを作成します：

```text title="location_prepend.conf"
resolver 8.8.8.8 valid=30s;

location ~ ^/subfolder {
  # $http_x_forwarded_protoが空（上流のリバースプロキシから設定されていない場合）であれば、
  # 現在のスキームに設定します。
  set_if_empty $http_x_forwarded_proto $scheme;

  proxy_set_header      X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header      X-Forwarded-Proto $scheme;
  proxy_set_header      X-Forwarded-Proto $http_x_forwarded_proto;
  proxy_set_header      X-Lagoon-Forwarded-Host $ ホスト;
  # 元のホストを下流が知るために使用されます。
  proxy_set_header      X-REVERSEPROXY $hostname;
  proxy_set_header      FORWARDED "";
  # drupal8が設定されているとエラーを出すため、FORWARDEDを未設定にします。
  proxy_set_header      Proxy "";
  # drupal8が設定されているとエラーを出すため、Proxyを未設定にします。
  proxy_ssl_server_name on;

  # DNS解決が正しく機能するためには、NGINXに変数を設定する必要があります。
  set                   $subfolder_drupal_host "https://nginx-lagoonproject-${LAGOON_GIT_SAFE_BRANCH}.clustername.com:443";
  # LAGOON_GIT_SAFE_BRANCH変数はdockerエントリーポイント時に置換されます。
  proxy_pass            $subfolder_drupal_host;
  proxy_set_header      Host $proxy_host;
  # $proxy_hostはproxy_passに基づいてNGINXによって自動生成されます（スキームとポートは不要です）。

  expires off; # プロキシからのキャッシュヘッダーを尊重し、上書きしないようにします
```

以下の文字列を置換してください：

* `/subfolder` を使用したいサブフォルダの名前に置換します。例えば、`/blog`。
* `nginx` をサブフォルダプロジェクト内で指すサービスに置換します。
* `lagoonproject` をサブフォルダプロジェクトのLagoonプロジェクト名に置換します。

### N GINX Dockerfile

以下をあなたのNGINX Dockerfile（`nginx.dockerfile`または`Dockerfile.nginx`）に追加してください：

```text title="nginx.dockerfile"
COPY location_prepend.conf /etc/nginx/conf.d/drupal/location_prepend.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/*
```

## サブフォルダアプリケーションの変更

ルートアプリケーションと同様に、サブフォルダアプリケーション（この例では、`www.example.com/blog`のDrupalインストール）にも、サブフォルダ下で動作していることを教える必要があります。これを行うために、以下の2つのファイルを作成します：

### `location_drupal_append_subfolder.conf`

サブフォルダのDrupalインストールのルートに`location_drupal_append_subfolder.conf`という名前のファイルを作成します：

```text title="location_drupal_append_subfolder.conf"
# `subfolder`という接頭辞がついたスクリプト名を注入すると、Drupalは
# `subfolder`が接頭辞として付けられたすべてのURLを描画します
fastcgi_param  SCRIPT_NAME        /subfolder/index.php;

# リバースプロキシ経由で実行している場合、元のHOST URLを
# PHPに注入します。これにより、Drupalは元のHOST URLで
# すべてのURLを描画し、現在使用しているHOSTではありません。

# 最初に、HOSTを通常のホスト変数に設定します。
fastcgi_param  HTTP_HOST          $http
``` _host;
# それが存在する場合は、`X-Lagoon-Forwarded-Host`で上書きします。
fastcgi_param  HTTP_HOST          $http_x_lagoon_forwarded_host if_not_empty;
```

`/subfolder`を使用したいサブフォルダの名前に置き換えてください。例えば、`/blog`。

### `server_prepend_subfolder.conf`

サブフォルダのDrupalインストールのルートに`server_prepend_subfolder.conf`という名前のファイルを作成します：

```text title="server_prepend_subfolder.conf"
# 内部のNGINXリライトを行う前に、リダイレクトを確認します。
# これは、内部のNGINXリライトが `last`を使用するためで、
# これはNGINXにリライトをこれ以上確認しないよう指示します（そして
# `if`はリダイレクトモジュールの一部です）。
include /etc/nginx/helpers/010_redirects.conf;

# これは内部のNGINXリライトで、リクエストから`/subfolder/`を
# 削除して、NGINXが最初から`/`だったかのようにリクエストを
# 処理します。
# `last`フラグも重要です。これはNGINXにこれ以上のリライトを
# 実行しないよう指示します。なぜなら、以下のリライトで永遠に
# リダイレクトするからです。
rewrite ^/subfolder/(.*)          /$1             last;

# リダイレクトが絶対ではないことを確認し、URLのホストをNGINXが
# 上書きしないようにします - これは # NGINXが現在提供しているもの以外の何かである可能性があります。
absolute_redirect off;

# リクエストが`/subfolder`だけの場合、301リダイレクトを`/subfolder/`にします
# (Drupalは末尾のスラッシュが大好き)
rewrite ^/subfolder               /subfolder/     permanent;

# 他の全てのリクエストに対しては、301リダイレクトを`/subfolder/`でプレフィックスします。
rewrite ^\/(.*)                   /subfolder/$1   permanent;
```

`/subfolder`を使用したいサブフォルダの名前に置き換えてください。例えば、`/blog`。

### NGINX Dockerfile

また、NGINX Dockerfileも修正する必要があります。

以下をNGINX Dockerfile (`nginx.dockerfile` または `Dockerfile.nginx`)に追加してください：

```text title="nginx.dockerfile"
COPY location_drupal_append_subfolder.conf /etc/nginx/conf.d/drupal/location_drupal_append_subfolder.conf
COPY server_prepend_subfolder.conf /etc/nginx/conf.d/drupal/server_prepend_subfolder.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/*
```