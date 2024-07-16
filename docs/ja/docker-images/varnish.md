# Varnish

[Lagoonの `Varnish`イメージDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish)です。 [公式 `Varnish`パッケージ](https://hub.docker.com/_/varnish)をベースに作成されています。

## サポートされているバージョン { #supported-versions }

* 5(互換性のためのみ利用可能、公式サポートは終了しています)- `uselagoon/varnish-5`
* 6.0 LTS [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish/6.Dockerfile) - `uselagoon/varnish-6`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish/7.Dockerfile) - `uselagoon/varnish-7`

## Varnishモジュール { #included-varnish-modules }

* [`vbox-dynamic`](https://github.com/nigoroll/libvmod-dynamic) - DNS ルックアップと SRV レコードからのサービス検出によるダイナミックバックエンド
* [`vbox-bodyaccess`](https://github.com/aondio/libvmod-bodyaccess) - リクエストボディにアクセスできる Varnish `vmod`

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。

## `default.vcl` 設定ファイル { #included-defaultvcl-configuration-file }

このイメージには、Lagoonで動作するように最適化されたデフォルトの`vcl`設定ファイルが含まれています。いくつかのオプションは環境変数で設定可能です([環境変数](#environment-variables)を参照して下さい)。

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定可能です。

| 環境変数                   | デフォルト            | 説明                                                                                    |
| :------------------------- | :-------------------- | :-------------------------------------------------------------------------------------- |
| VARNISH_BACKEND_HOST       | NGINX                 | デフォルトのバックエンドホスト                                                         |
| VARNISH_BACKEND_PORT       | 8080                  | デフォルトのVarnishポート                                                    |
| VARNISH_SECRET             | lagoon_default_secret | 管理に接続するために使用されるVarnishシークレット                                    |
| LIBVMOD_DYNAMIC_VERSION    | 5.2                   | `vmod-dynamic`モジュールのデフォルトバージョン
| LIBVMOD_BODYACCESS_VERSION | 5.0                   | `vmod-bodyaccess`モジュールのデフォルトバージョン                                            |
| HTTP_RESP_HDR_LEN          | 8k                    | 任意のHTTPバックエンドレスポンスヘッダの最大長                                        |
| HTTP_RESP_SIZE             | 32k                   | 処理可能なHTTPバックエンドレスポンスの最大バイト数                               |
| NUKE_LIMIT                 | 150                   | オブジェクトボディのための空きを作るために削除を試みるオブジェクトの最大数 |
| CACHE_TYPE                 | malloc                | varnishキャッシュのタイプ                                                               |
| CACHE_SIZE                 | 100M                  | キャッシュサイズ                                                                       |
| LISTEN                     | 8080                  | デフォルトのバックエンドサーバーポート                                                  |
| MANAGEMENT_LISTEN          | 6082                  | デフォルトの管理リスニングポート            |
