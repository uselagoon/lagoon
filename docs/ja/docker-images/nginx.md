# NGINX

[Lagoonの `nginx` イメージDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx/Dockerfile)です。公式の[`openresty/openresty` イメージ](https://hub.docker.com/r/openresty/openresty/)をベースに作成されています。

このDockerfileは、Lagoon内のあらゆるウェブサーバーのベースとして使用することを想定しています。

## Lagoonの調整事項

NGINXコンテナのデフォルトの公開ポートは `8080` ポートです。

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `/etc/nginx/*` 内のファイルは、コンテナエントリーポイントによって [`envplate`](https://github.com/kreuzwerker/envplate) を通じて処理されます。

## `NGINX` 設定(`static-files.conf`)

!!! Warning "警告"
    デフォルトでは `NGINX` は静的ファイルのみを提供します。これはデータベースやPHPコンポーネントが必要ない静的サイトに使用できます:例えば、静的サイトジェネレーターの [Hugo](https://gohugo.io/)、[Jekyll](https://jekyllrb.com/)、[Gatsby](https://www.gatsbyjs.org/) などです。

PHPが必要な場合は、`php-fpm`イメージを参照し、`nginx`と`php-fpm`を一緒に使用してください。

コンテンツはビルドプロセス中にビルドし、`nginx`コンテナに投入します。

## ヘルパー

### `redirects-map.conf`

リダイレクトを作成するために、`redirects-map.conf`ファイルが用意されています。これを使用して、マーケティングドメインをサブサイトにリダイレクトしたり、wwwなしをwww付きにするリダイレクトを行うことができます。**リダイレクトが多い場合は、メンテナンス性を向上させるために`redirects-map.conf`をコードの隣に保存することを推奨します。**

!!! Note "注意:"
    リダイレクトが少ない場合は、`nginx.dockerfile`の`RUN`コマンドを使用してリダイレクトを作成する便利な方法があります。

以下は、`www.example.com`を`example.com`にリダイレクトし、リクエストを保持する方法を示す例です:

```bash title="Redirect"
RUN echo "~^www.example.com http://example.com\$request_uri;" >> /etc/nginx/redirects-map.conf
```

リダイレクトの種類の詳細については、[`redirects-map.conf`](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx/redirects-map.conf)のドキュメントを参照してください。

`redirects-map.conf`を配置したら、ビルドに設定ファイルを取り込むために、`nginx.dockerfile`にもそれをインクルードする必要があります。

```bash title="nginx.dockerfile"
COPY redirects-map.conf /etc/nginx/redirects-map.conf
```

### ベーシック認証

`BASIC_AUTH_USERNAME`および `BASIC_AUTH_PASSWORD` [環境変数](../concepts-advanced/environment-variables.md)が設定されている場合、ベーシック認証は自動的に有効になります。

!!! Warning "警告"
    ベーシック認証の自動設定は、利便性のために提供されています。ウェブサイトや機密データを保護するための安全な方法とはみなされません。

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)を使用して設定できます。

| 環境変数 | デフォルト    | 説明 |
| :------------------- | :--------- | :--- |
| BASIC_AUTH           | restricted | ベーシック認証を無効にするには `off` に設定します                               |
| BASIC_AUTH_USERNAME  | (設定なし)  | ベーシック認証のユーザーネーム                               |
| BASIC_AUTH_PASSWORD  | (設定なし)  | ベーシック認証のパスワード(非暗号化)                               |
| FAST_HEALTH_CHECK    | (設定なし)  | 特定のユーザーエージェント(StatusCake、Pingdom、Site25x7、Uptime、nagios)からのGETリクエストは、軽量なLagoonサービスヘルスチェックにリダイレクトするには、`true`に設定します。 |
