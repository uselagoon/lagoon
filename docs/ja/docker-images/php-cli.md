# PHP-CLI

[Lagoonの `php-cli` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli)です。[Lagoonの `php-fpm`イメージ](./php-fpm.md)をベースに、日常的な操作に必要なコマンドラインツールがすべて揃っています。

`cli`イメージから起動されたコンテナ(またはポッド)はComposerやNode.jsベースのプロジェクトのコードビルドを担当します。

また、MariaDBとPostgreSQL両方のデータベース`cli`が含まれています。

!!! Info "情報"
    このDockerfileは、Lagoon内でのあらゆる`cli`ニーズの基盤として使用されることを想定しています。

## サポートされているバージョン { #supported-versions }

* 7.3(互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/php-7.3-cli`
* 7.4(互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/php-7.4-cli`
* 8.0(互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/php-8.0-cli`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.1.Dockerfile)(2024年11月までセキュリティサポート) - `uselagoon/php-8.1-cli`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.2.Dockerfile)(2025年12月までセキュリティサポート) - `uselagoon/php-8.2-cli`
* 8.3 [ Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.3.Dockerfile) (2026年12月までのセキュリティサポート) - `uselagoon/php-8.3-cli`

すべてのPHPバージョンは、それぞれのDockerfilesを使用します。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `COMPOSER_ALLOW_SUPERUSER=1`は、rootとしてComposerを使用することに関する警告を削除します。
* `80-shell-timeout.sh`スクリプトは、コンテナがKubernetes環境で実行されているかどうかを確認し、アイドル状態の`cli`ポッドに対して10分のタイムアウトを設定します。
* `cli`コンテナは、Lagoonによって注入されるか、`SSH_PRIVATE_KEY`環境変数で定義されたSSHキーを使用します。

## CLIツール

組み込まれているCLIツールは以下の通りです:

* [`composer`バージョン1.9.0](https://getcomposer.org/) \( `COMPOSER_VERSION`および`COMPOSER_HASH_SHA256`経由で変更可能\)
* [`node.js`バージョン17](https://nodejs.org/en/) \(2022年3月現在\)
* [`npm`](https://www.npmjs.com/)
* [`yarn`](https://yarnpkg.com/lang/en/)
* `mariadb-client`
* `postgres ql-client`

### Node.jsバージョンの変更

デフォルトでは、このイメージには`nodejs-current`パッケージ(2022年3月時点でv17)が搭載されています。別のバージョンが必要な場合は、現在のバージョンを削除して目的のバージョンをインストールできます。例えば、Node.js 16をインストールするには、Dockerfileを次のように変更します。

```bash title="Node.jsバージョンの更新"
RUN apk del nodejs-current \
    && apk add --no-cache nodejs=~16
```

## 環境変数 { #environment-variables }

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定できます。[php-fpm環境変数](php-fpm.md#environment-variables)も適用されます。

| 名前                       | デフォルト | 説明                                           |
| :------------------------- | :------ | :---------------------------------------------------- |
| MARIADB_MAX_ALLOWED_PACKET | 64M     | MySqlクライアントの最大許容パケットサイズを制御します。 |
