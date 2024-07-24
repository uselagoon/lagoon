# WordPressをLagoonで実行

[WordPressテンプレート](https://www.github.com/lagoon-examples/wordpress-base)は、Composerを使用してWordPress、その依存関係、およびテーマをインストールするように設定されています。

このWordPressテンプレートは、[https://github.com/roots/bedrock](https://github.com/roots/bedrock)のボイラープレートをベースにしていますが、標準化されたLagoonのデプロイメントパターンに合わせて拡張されています。

## Composerインストール

このテンプレートは、WordPressとそのテーマをインストールするためにComposerを使用します。

## データベース

LagoonはMariaDBとPostgreSQLデータベースをサポートしていますが、WordPressでのPostgreSQLのサポートは限定的なので、使用は推奨されません。

## NGINXの設定

LagoonにはWordPress用の組み込み設定がありません - 代わりに、テンプレートには[初期設定のnginx.conf](https://github.com/lagoon-examples/wordpress-base/tree/main/lagoon/nginx)が付属しています。改善点があれば、ぜひ貢献してください！

## WP-CLI

Lagoonテンプレートは、WordPressのインストールを管理するために`wp-cli`をcliイメージにインストールします。
