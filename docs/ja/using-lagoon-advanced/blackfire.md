# ブラックファイア

## Blackfireの変数

Lagoon Base Imagesには、PHP ImagesにBlackfireのサポートが組み込まれています。([PHP images](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm/entrypoints/80-php-blackfire.sh)を参照)

LagoonでBlackfireを使用するためには、以下の3つの環境変数を定義する必要があります。

| 環境変数 | デフォルト | 説明 |
| :--- | :--- | :--- |
| `BLACKFIRE_ENABLED` | \(設定なし\) | `TRUE`または`true`に設定することで`blackfire`拡張を有効にする。 |
| `BLACKFIRE_SERVER_ID` | \(設定なし\) | Blackfire.ioから提供されるBlackfire Server IDに設定する。`BLACKFIRE_ENABLED`を`true`に設定する必要がある。 |
| `BLACKFIRE_SERVER_TOKEN` | \(設定なし\) | Blackfire.ioから提供されるBlackfire Server Tokenに設定する。`BLACKFIRE_ENABLED`を`true`に設定する必要がある。 |

## Blackfireのローカル使用

Lagoon ImagesでBlackfireをローカルで使用する場合、上記の環境変数をPHPコンテナに設定します。以下はDrupalアプリケーションの例です。

```yaml title="docker-compose.yml"

services:

[[snip]]

  php:
    [[snip]]

    environment:
      << : *default-environment # 定義された環境変数を上から読み込む
      BLACKFIRE_ENABLED: TRUE
      BLACKFIRE_SERVER_ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      BLACKFIRE_SERVER_TOKEN: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

コンテナを再起動した後、[Blackfireブラウザプラグイン](https://blackfire.io/docs/profiling-cookbooks/profiling-http-via-browser)または[Blackfire CLI](https://blackfire.io/docs/profiling-cookbooks/profiling-http-via-cli)を通じてプロファイルを作成することができるはずです。

## Blackfireのリモート使用

デプロイされたLagoon環境でBlackfireを使用するためには、同じ環境変数を設定する必要があります。この時、[Lagoonに環境変数を追加する](../concepts-advanced/environment-variables.md)方法で設定します。

!!! warn "重要"
    ローカル開発用に`docker-compose.yml`に設定された環境変数はLagoonのリモート環境では使用されません！

## デバッグ

PHPコンテナで動作しているBlackfireエージェントは、通常のコンテナログとしてログを出力します。これは`docker-compose logs`またはリモート環境の`Lagoon Logging Infrastructure`を通じて見ることができます。

デフォルトでは、ログはレベル`3`(情報)に設定されていますが、環境変数`BLACKFIRE_LOG_LEVEL`を使ってレベルを`4`(デバッグ)に上げることで、より多くの情報を生成することができます。
