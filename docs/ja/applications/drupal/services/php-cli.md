# PHP-cli

[Lagoonの`php-cli-drupal` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal)はDrupalと連携するために最適化されています。これは[Lagoonの`php-cli`イメージ](../../../docker-images/php-cli.md)を基に作られており、Drupalウェブサイトの日々のメンテナンスに必要なコマンドラインツール全てが含まれています。

* `drush`
* `drupal console`
* `drush launcher` \(Drushがインストールされたサイトが見つからない場合、Drush 8にフォールバックします\)

## サポートされているバージョン { #supported-versions }

* 7.3 \(互換性のために利用可能ですが、公式サポートは終了\)
* 7.4 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/7.4.Dockerfile) - `uselagoon/php-7.4-cli-drupal`
* 8.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.0.Dockerfile) - `uselagoon/php-8.0-cli-drupal`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.1.Dockerfile) - `uselagoon/php-8.1-cli-drupal`

全てのPHPバージョンはそれぞれのDockerfilesを使用します。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
