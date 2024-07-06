# PHP-CLI-Drupal

[Lagoonの`php-cli-drupal` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal)はDrupalと連携するために最適化されています。これは[Lagoonの`php-cli`イメージ](../../../docker-images/php-cli.md)を基に作られており、Drupalウェブサイトの日々のメンテナンスに必要なコマンドラインツール全てが含まれています。

* `drush`
* `drupal console`
* `drush launcher` \(サイトにインストールされたDrushが見つからない場合はDrush 8にフォールバックします\)

## サポートされているバージョン { #supported-versions }

* 7.3 \(互換性のために利用可能ですが、公式にはサポートされていません\)
* 7.4 \(互換性のために利用可能ですが、公式にはサポートされていません\) - `uselagoon/php-7.4-cli-drupal`
* 8.0 \(互換性のために利用可能ですが、公式にはサポートされていません\) - `uselagoon/php-8.0-cli-drupal`
* 8.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.1.Dockerfile) - `uselagoon/php-8.1-cli-drupal`
* 8.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.2.Dockerfile) - `uselagoon/php-8.2-cli-drupal`
* 8.3 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli-drupal/8.3.Dockerfile) - `uselagoon/php-8.3-cli-drupal`

全てのPHPバージョンはそれぞれのDockerfilesを使用します。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用するために準備されています。そのため、すでにいくつかの事項が完了しています:

* フォルダのパーミッションは自動的に適応されます [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)を使用して、この画像はランダムなユーザーと一緒に動作します。
