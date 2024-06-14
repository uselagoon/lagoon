# NGINX

[Lagoonの `nginx` イメージDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx/Dockerfile)です。公式の[`openresty/openresty` イメージ](https://hub.docker.com/r/openresty/openresty/)を基に作成されています。

このDockerfileは、Lagoon内の任意のウェブサーバーのベースとして使用することを目的としています。

## Lagoonの調整事項

NGINXコンテナのデフォルトの公開ポートは `8080` ポートです。

このイメージはLagoonで使用するために準備されています。そのため、すでにいくつかの事項が処理されています：

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)により自動的に適応されるため、このイメージはランダムなユーザーでも動作します。
* `/etc/nginx/*` 内のファイルは、コンテナエントリーポイントを使用して [`envplate`](https://github.com/kreuzwerker/envplate) を通じて解析されます。

## 含まれる `NGINX` 設定（`static-files.conf`）

!!! 警告
    デフォルトでは `NGINX` は静的ファイルのみを提供します - これはデータベースやPHPコンポーネントが必要ない静的サイトに使用できます：例えば、静的サイトジェネレーターの [Hugo](https://gohugo.io/)、[Jekyll](https://jekyllrb.com/)、[Gatsby](https://www.gatsbyjs.org/) などです。

PHPが必要な場合は、以下を参照してください。 `php-fpm`イメージを見て、`nginx`と`php-fpm`を一緒に使用します。

ビルドプロセス中にコンテンツをビルドし、それを`nginx`コンテナに注入します。

## ヘルパー

### `redirects-map.conf`

リダイレクトを作成するために、私たちは`redirects-map.conf`を設置しています。これにより、マーケティングドメインをサブサイトにリダイレクトしたり、非wwwからwwwへのリダイレクトを行うことができます。**リダイレクトが多い場合は、`redirects-map.conf`をコードの隣に保存することでメンテナンスが容易になります。**

!!! 注意
    リダイレクトが少ない場合は、`RUN`コマンドを使って`nginx.dockerfile`でリダイレクトを作成する便利な方法があります。

以下は、`www.example.com`を`example.com`にリダイレクトし、リクエストを保持する方法を示した例です：

```bash title="Redirect"
RUN echo "~^www.example.com http://example.com\$request_uri;" >> /etc/nginx/redirects-map.conf
```

達成可能なさまざまなタイプのリダイレクトについて詳しく知りたい場合は、[`redirects-map.conf`](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx/redirects-map.conf)のドキュメンテーションを直接参照してください。

`redirects-map.conf`を設置した後、それを`nginx.dockerfile`にも含める必要があります。 ビルドに設定ファイルを取り込む方法。

```bash title="nginx.dockerfile"
COPY redirects-map.conf /etc/nginx/redirects-map.conf
```

### 基本認証

`BASIC_AUTH_USERNAME`
および `BASIC_AUTH_PASSWORD` [環境
変数](../concepts-advanced/environment-variables.md)が設定されている場合、基本認証は自動的に有効になります。

!!! 警告
    自動基本認証設定は便宜上提供されています。ウェブサイトやプライベートデータを保護する安全な方法とは考えられません。

## 環境変数 { #environment-variables }

いくつかのオプションは[環境
変数](../concepts-advanced/environment-variables.md)を介して設定可能です。

| 環境変数 | デフォルト    | 説明 |
| :------------------- | :--------- | :--- |
| BASIC_AUTH           | restricted | 基本認証を無効にするには `off` に設定します。                                                                                                                  |
| BASIC_AUTH_USERNAME  | (設定なし)  | 基本認証のユーザーネーム。                                                                                                                             |
| BASIC_AUTH_PASSWORD  | (設定なし)  | 基本認証のパスワード。 基本認証（非暗号化）。                                                                                                               |
| FAST_HEALTH_CHECK    | (未設定)  | 特定のユーザーエージェント（StatusCake、Pingdom、Site25x7、Uptime、nagios）からのGETリクエストを軽量なLagoonサービスヘルスチェックにリダイレクトするには、`true`に設定します。 |
