# Lagoon上のWordPress

[WordPressテンプレート](https://www.github.com/lagoon-examples/wordpress-base)は、WordPress、その依存性、およびテーマをインストールするためにComposerを使用するように設定されています。

WordPressテンプレートは、[https://github.com/roots/bedrock](https://github.com/roots/bedrock)ボイラープレートを基にしていますが、標準化されたLagoonのデプロイメントパターンに合わせて拡張されています。

## Composerインストール

テンプレートは、WordPressとそのテーマをインストールするためにComposerを使用します。

## データベース

LagoonはMariaDBとPostgreSQLデータベースをサポートしていますが、WordPressでのPostgreSQLのサポートは限定的なので、使用は推奨されません。

## NGINXの設定

LagoonにはWordPress用の組み込み設定がありません - 代わりに、テンプレートには[初期設定のnginx.conf](https://github.com/lagoon-examples/wordpress-base/tree/main/lagoon/nginx)が付属しています - あなたが見つけた改善点をぜひ投稿してください!

## WP-CLI

Lagoonテンプレートは、WordPressのインストールを管理するために`wp-cli`をcliイメージにインストールします。