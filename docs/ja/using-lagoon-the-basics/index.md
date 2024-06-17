# Lagoonの使用 - 概要

このセクションでは、Lagoonの基本的な特徴と機能について説明します。これらに慣れている方は、[Lagoonの使用 - 上級](../using-lagoon-advanced/index.md)に進んでください。

ヘルプが必要な場合は、Lagoonの管理者に連絡するか、私たちの[Discord](../community/discord.md)でコミュニティとメンテナに問い合わせてください。

## 必要条件

### Docker

Lagoonプロジェクトを実行するには、システムがDockerを実行するための要件を満たしている必要があります。ワークステーションに最新バージョンのDockerをインストールすることをおすすめします。Dockerは[こちら](https://www.docker.com/get-docker)からダウンロードできます。また、Dockerには最低でも**4 CPUs**と**4 GB RAM**を割り当てることをおすすめします。

### ローカル開発環境

pygmy、Lando、DDEVから選ぶことができます - 選択はあなた次第です！

Lagoonと[ローカル開発環境](local-development-environments.md)についてもっと学びましょう。

## ステップバイステップのガイド { #step-by-step-guides }

* 一般: [Lagoonで新しいプロジェクトを設定する](setup-project.md)
* 一般: [初めてのデプロイ](first-deployment.md)
* Drupal: [Drupalでの初めてのデプロイ](../applications/drupal/first-deployment-of-drupal.md)
* Drupal: [DrupalサイトをLagoon対応にする](../applications/drupal/step-by-step-getting-drupal-ready-to-run-on-lagoon.md)
* すべて: [Lagoonのビルドとデプロイメントプロセス](../concepts-basics/build-and-deploy-process.md)

## Lagoon設定ファイルの概要

### `.lagoon.yml`

これはLagoonが何をデプロイするべきか、また多くの他の事柄を理解するために使用する主要なファイルです。[`.lagoon.yml`のドキュメンテーション](../concepts-basics/lagoon-yml.md)を参照してください。

### `docker-compose.yml`

このファイルは`Docker Compose`によってローカル開発環境を開始するために使用されます。Lagoonもこれを使用して、どのサービスがデプロイされるべきか、どのタイプで、どのようにビルドするかを理解します。これは`labels`を通じて行われます。[`docker-compose.yml`のドキュメンテーション](../concepts-basics/docker-compose-yml.md)を参照してください。

### Dockerfiles

一部のDockerイメージとコンテナは、提供されたイメージから追加のカスタマイズが必要です。これには通常、2つの理由があります:

1. **アプリケーションコード**: NGINX、PHP、Node.jsなどのコンテナは、そのイメージ内に実際のプログラミングコードが必要です。これはDockerビルドステップ中に行われ、Dockerfileで設定されます。LagoonはDockerを完全にサポートしており、そのためDockerfileのカスタマイズを通じて結果として得られるイメージに対する完全なコントロールを許可します。
2. **イメージのカスタマイズ **: Lagoonでは、ベースイメージをあなたのニーズに合わせてカスタマイズすることも可能です。これには、追加の環境変数を挿入したり、サービスの設定を変更したり、さらに追加のツールをインストールすることも含まれます。Dockerイメージに追加のツールをインストールする際には注意が必要です。なぜなら、将来的に任意の適応を維持する必要があるからです！

## Lagoonによるサポートサービスとベースイメージ

| タイプ | バージョン | Dockerfile |
| :--- | :--- | :--- |
| [MariaDB](../docker-images/mariadb.md) | 10.4, 10.5, 10.6, 10.11 | [mariadb/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mariadb) |
| [PostgreSQL](../docker-images/postgres.md) | 11, 12, 13, 14, 15 | [postgres/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/postgres) |
| [MongoDB](../docker-images/mongodb.md) | 4 | [mongo/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/mongo) |
| [NGINX](../docker-images/nginx.md) | openresty/1.21 | [nginx/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx) |
| [Node.js](../docker-images/nodejs.md) | 16, 18, 20 | [node/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/node) |
| [PHP FPM](../docker-images/php-fpm.md) | 8.0, 8.1, 8.2 | [php/fpm/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-fpm) |
| [PHP CLI](../docker-images/php-cli.md) | 8.0, 8.1, 8.2 | [php/cli/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/php-cli) |
| [Python](../docker-images/nodejs.md) | 3.7, 3.8, 3.9, 3.10, 3.11 | [python/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/python) |
| [Redis](../docker-images/redis.md) | 5, 6, 7 | [redis/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis) |
| [Solr](../docker-images/solr.md) | 7, 8 | [solr/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/solr) |
| [Varnish](../docker-images/varnish.md) | 5, 6, 7 | [varnish/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish) |
| [Opensearch](../docker-images/opensearch.md) | 2 | [opensearch/Dockerfiles](https://github.com/uselagoon/lagoon-images/blob/main/images/opensearch) |
| [RabbitMQ](../docker-images/rabbitmq.md) | 3.10 | [rabbitmq/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/rabbitmq) |
| [Ruby](../docker-images/ruby.md) | 3.0, 3. 1、3.2 | [ruby/Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby) |

すべてのイメージは[https://hub.docker.com/u/uselagoon](https://hub.docker.com/u/uselagoon)にプッシュされます。特性とセキュリティの観点から常に最新のタグ(例:`uselagoon/nginx:latest`)を使用することをおすすめします。

特定のLagoonバージョンのイメージ、例えば`uselagoon/nginx:20.10.0`や`uselagoon/node-10:20.10.0`を使用する場合、新しいLagoonバージョンがリリースされたらすぐにイメージのバージョンをアップグレードするのはあなた自身の責任です！
