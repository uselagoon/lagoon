# PHP-CLI

[Lagoonの `php-cli` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli)です。[Lagoonの `php-fpm`イメージ](./php-fpm.md)を基に、日常的な操作に必要なコマンドラインツールが全て揃っています。

`cli`イメージから起動されたコンテナ（またはポッド）はComposerやNode.jsベースのプロジェクトのコードを構築する責任があります。

また、このイメージにはMariaDBとPostgreSQLの両方のデータベース`cli`が含まれています。

!!! インフォ
    このDockerfileは、Lagoon内で`cli`が必要な場合に基本として使用することを意図しています。

## サポートされているバージョン

* 7.3（互換性のために利用可能、公式サポートは終了） - `uselagoon/php-7.3-cli`
* 7.4（互換性のために利用可能、公式サポートは終了） - `uselagoon/php-7.4-cli`
* 8.0（互換性のために利用可能、公式サポートは終了） - `uselagoon/php-8.0-cli`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.1.Dockerfile)（2024年11月までセキュリティサポート） - `uselagoon/php-8.1-cli`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.2.Dockerfile)（2025年12月までセキュリティサポート） - `uselagoon/php-8.2-cli`
* 8.3 [ Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli/8.3.Dockerfile) (2026年12月までのセキュリティサポート) - `uselagoon/php-8.3-cli`

すべてのPHPバージョンは、それぞれのDockerfilesを使用します。

## Lagoonの適応

このイメージはLagoonで使用するために準備されています。そのため、すでにいくつかの事項が完了しています：

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `COMPOSER_ALLOW_SUPERUSER=1`は、rootとしてのComposerの使用に関する警告を削除します。
* `80-shell-timeout.sh`スクリプトは、コンテナがKubernetes環境で実行されているかどうかを確認し、その後、アイドル`cli`ポッドに10分のタイムアウトを設定します。
* `cli`コンテナは、Lagoonによって注入されたSSHキーまたは`SSH_PRIVATE_KEY`環境変数に定義されたSSHキーを使用します。

## 含まれるCLIツール

含まれるCLIツールは次のとおりです：

* [`composer`バージョン1.9.0](https://getcomposer.org/) \( `COMPOSER_VERSION`および`COMPOSER_HASH_SHA256`経由で変更可能\)
* [`node.js`バージョン17](https://nodejs.org/en/) \(2022年3月現在\)
* [`npm`](https://www.npmjs.com/)
* [`yarn`](https://yarnpkg.com/lang/en/)
* `mariadb-client`
* `postgres ql-client`

### Node.jsバージョンの変更

デフォルトでは、このイメージには`nodejs-current`パッケージ（2022年3月時点でv17）が付属しています。別のバージョンが必要な場合は、現在のバージョンを削除して選択したバージョンをインストールできます。例えば、Node.js 16をインストールするには、dockerfileを以下のように修正します。

```bash title="Node.jsバージョンの更新"
RUN apk del nodejs-current \
    && apk add --no-cache nodejs=~16
```

## 環境変数

いくつかのオプションは[環境変数](../concepts-advanced/environment-variables.md)を介して設定可能です。[php-fpm環境変数](php-fpm.md#environment-variables)も適用されます。

| 名前                       | デフォルト | 説明                                           |
| :------------------------- | :------ | :---------------------------------------------------- |
| MARIADB_MAX_ALLOWED_PACKET | 64M     | MySqlクライアントの最大許容パケットを制御します。 |