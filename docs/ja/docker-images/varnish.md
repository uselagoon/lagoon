# Varnish

[Lagoonの `Varnish` Docker画像](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish)です。 [公式 `Varnish`パッケージ](https://hub.docker.com/_/varnish)に基づいています。

## サポートされているバージョン { #supported-versions }

* 5（互換性のためだけに利用可能、公式にはもうサポートされていません）- `uselagoon/varnish-5`
* 6.0 LTS [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish/6.Dockerfile) - `uselagoon/varnish-6`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish/7.Dockerfile) - `uselagoon/varnish-7`

## 含まれているバニッシュモジュール { #included-varnish-modules }

* [`vbox-dynamic`](https://github.com/nigoroll/libvmod-dynamic) - DNSルックアップとSRVレコードからのサービスディスカバリからのダイナミックバックエンド。
* [`vbox-bodyaccess`](https://github.com/aondio/libvmod-bodyaccess) - リクエストボディにアクセスできるようにするVarnish `vmod`。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用するために準備されています。そのため、すでにいくつかの作業が行われています：

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に調整されるため、このイメージはランダムなユーザーで動作します。

## 含まれている `default.vcl` 設定ファイル { #included-defaultvcl-configuration-file }

このイメージには、Lagoonで動作するように最適化されたデフォルトの`vcl`設定ファイルが付属しています。いくつかのオプションは環境変数を介して設定可能です（[環境変数](#environment-variables)を参照）。

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)を介して設定可能です。

| 環境変数                   | デフォルト            | 説明                                                                                    |
| :------------------------- | :-------------------- | :-------------------------------------------------------------------------------------- |
| VARNISH_BACKEND_HOST       | NGINX                 | デフォルトのバックエンドホスト。                                                         |
| VARNISH_BACKEND_PORT       | 8080                  | デフォルトのVarnishリスニングポート。                                                    |
| VARNISH_SECRET             | lagoon_default_secret | 管理に接続するために使用されるVarnishのシークレット。                                    |
| LIBVMOD_DYNAMIC_VERSION    | 5.2                   | `vmod-dynamic`モジュールのデフォルトバージョン。 | LIBVMOD_BODYACCESS_VERSION | 5.0                   | `vmod-bodyaccess`モジュールのデフォルトバージョン。                                            |
| HTTP_RESP_HDR_LEN          | 8k                    | 任意のHTTPバックエンドレスポンスヘッダの最大長さ。                                        |
| HTTP_RESP_SIZE             | 32k                   | 取り扱うHTTPバックエンドレスポンスのバイト数の最大値。                               |
| NUKE_LIMIT                 | 150                   | オブジェクトボディのスペースを作るために削除しようとするオブジェクトの最大数。 |
| CACHE_TYPE                 | malloc                | varnishキャッシュのタイプ。                                                               |
| CACHE_SIZE                 | 100M                  | キャッシュサイズ。                                                                       |
| LISTEN                     | 8080                  | デフォルトのバックエンドサーバーポート。                                                  |
| MANAGEMENT_LISTEN          | 6082                  | デフォルトの管理リスニングポート。 あなたが提供する内容は何ですか？
