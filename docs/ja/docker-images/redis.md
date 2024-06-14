# Redis

[Lagoon `Redis`イメージDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis) は、[公式 `redis:alpine`イメージ](https://hub.docker.com/_/redis/)を元にしています。

このDockerfileは、デフォルトでスタンドアロンのRedis _エフェメラル_ サーバーをセットアップするために使用することを意図しています。

## サポートされているバージョン { #supported-versions }

* 5（互換性のためのみ利用可能、公式にはもはやサポートされていません） - `uselagoon/redis-5`または`uselagoon/redis-5-persistent`
* 6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/6.Dockerfile) - `uselagoon/redis-6`または`uselagoon/redis-6-persistent`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/7.Dockerfile) - `uselagoon/redis-7`または`uselagoon/redis-7-persistent`

## 使用方法

Redisイメージには2つの異なるバリエーションがあります：**エフェメラル** と **パーシステント**。

### エフェメラル

エフェメラルイメージは、アプリケーションのインメモリキャッシュとして使用することを意図しており、コンテナの再起動を越えてデータを保持しません。

インメモリ（RAM）キャッシュとして使用する場合、大きなキャッシュを持っている場合に最初に調整したいかもしれないことは、`MAXMEMORY`変数を適応させることです。この変数は、どの程度の最大メモリ（RAM）を制御します。 Redisはキャッシュアイテムの保存に使用します。

### 永続的

永続的なRedisイメージは、コンテナの再起動を越えてデータを永続化し、永続性が必要なキューまたはアプリケーションデータに使用できます。

通常、メモリ内キャッシュのシナリオで永続的なRedisを使用することはお勧めしません。これは、Redisコンテナが再起動し、ディスクからデータをロードしているときに、アプリケーションに予期しない副作用をもたらす可能性があるからです。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用するために準備されています。したがって、すでにいくつかのことが行われています：

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)を使用して自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `/etc/redis/*`内のファイルは、コンテナエントリーポイント経由で[`envplate`](https://github.com/kreuzwerker/envplate)を使用してテンプレート化されます。

## 含まれる `redis.conf` 設定ファイル

このイメージには、Lagoonで動作するように最適化された _default_ Redis設定ファイルが含まれています。

### 環境変数 { #environment-variables }

一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)を介して設定可能です。

| 環境変数 | デフォルト     |                                         説明                                         |
| :------------------- | :---------- | :----------------------------------------------------------------------------------------- |
| データベース            | -1          | スタートアップ時に作成されるデータベースのデフォルト数。                                            |
| ログレベル             | 通知      | ログのレベルを定義します。                                                                  |
| 最大メモリ使用量            | 100mb       | メモリの最大使用量。                                                                  |
| 最大メモリポリシー            | allkeys-lru | Redisが最大メモリ使用量に達したときにキーを追い出すためのポリシー。            |
| REDIS_PASSWORD       | 無効    | [認証機能](https://redis.io/topics/security#authentication-feature)を有効にします。 |

## カスタム設定

ベースイメージに基づいて、カスタム設定を含めることができます。
Redis設定ファイルの完全なドキュメンテーションについては、[こちら](https://raw.githubusercontent.com/antirez/redis/4.0/redis.conf)をご覧ください。

## Redis-persistent

以下に基づいています [Lagoonの `redis`イメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/5.Dockerfile)、[Lagoonの `redis-persistent` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/redis-persistent/5.Dockerfile)は、Redisサービスを`persistent`モード（つまり、キーがディスクに保存される永続化ボリュームで）で利用する場合に使われます。

これは`redis`との違いは、`FLAVOR`環境変数だけで、それは使用中のredisのバージョンにより、[それぞれのRedis設定](https://github.com/uselagoon/lagoon-images/tree/main/images/redis/conf)を使用します。

## トラブルシューティング

LagoonのRedisイメージにはすべて`redis-cli`コマンドが事前にロードされており、これによりRedisサービスに情報を問い合わせたり、設定値を動的に設定したりできます。このユーティリティを使用するには、[ここ](../interacting/ssh.md)の指示に従って`pod`の値として`redis`を使用してRedisポッドにSSH接続し、接続したらターミナルから実行します。

### 最大メモリポリシー

デフォルトでは、Lagoonの`redis`イメージは`allkeys-lru`ポリシーを使用するように設定されています。このポリシーでは、Redisに格納された**任意の**キーが、もし/ Redisサービスが、最近最も使用されていないキーに基づいて`maxmemory`制限に達した場合。

典型的なインストールでは、これが理想的な設定であり、DrupalがRedisでキャッシュされた各キーに`TTL`値を設定しない場合があります。 `maxmemory-policy`が`volatile-lru`のように設定されていて、Drupalがこれらの`TTL`タグを提供しない場合、これはRedisコンテナが埋まり、**いかなる**キーも追い出すことが完全にできなくなり、新しいキャッシュキーを全く受け付けなくなる結果となります。

Redisのmaxmemoryポリシーについての詳細情報は、Redisの[公式ドキュメンテーション](https://redis.io/docs/manual/eviction/#eviction-policies)で確認できます。

!!! danger "注意して進めてください"
    この設定を変更すると、Redisが完全にいっぱいになり、結果として停電を引き起こす可能性があります。

### Redisの`maxmemory`値の調整

Redisに与えるメモリの最適量を見つけるのはかなり難しい作業です。Redisキャッシュのメモリサイズを調整しようとする前に、実際にはできるだけ長い時間、通常通りに稼働させることが賢明です。理想的な最小期間は、少なくとも1日間の典型的な使用です。

これらのメモリ値を調整する際に考慮すべきいくつかの高レベルの事項があります：

* 最初に確認するべきことは 現在Redisが使用しているメモリの割合。
  * この割合が`50％`未満の場合は、`maxmemory`の値を25％下げることを検討してみてください。
  * この割合が`50％`と`75％`の間であれば、問題なく稼働しています。
  * この値が`75％`を超える場合、他の変数を見て`maxmemory`を増やす必要があるかどうか確認する価値があります。
* Redisのメモリ使用率が高いと判断した場合、次に見るべきはキーの追い出し数です。
  * 大量のキー追い出しとメモリ使用率が`95％`を超えると、Redisが`maxmemory`設定を高くする必要があることをかなりよく示しています。
  * キーの追い出し数が多くなく、通常の応答時間が妥当であれば、これは単にRedisがその割り当てられたメモリを期待通りに管理していることを示しています。

### 例のコマンド

以下のコマンドは、Redisサービスに関する情報を表示するために使用できます：

* Redisサービスに関するすべての情報を表示：`redis-cli info`
* サービスのメモリ情報を表示：`redis-cli info memory`
* サービスのキースペース情報を表示：`redis-cli info keyspace`
* サービスの統計情報を表示：`redis-cli info stats`

また、値を設定することも可能です Redisサービスを再起動せずに動的に設定することができます。動的に設定したこれらの値は、ポッドが再起動されると（デプロイメント、メンテナンス、あるいは単に一つのノードから別のノードへの移動の結果として起こり得る）永続化されません。

* `maxmemory`の設定値を動的に`500mb`に設定する: `config set maxmemory 500mb`
* `maxmemory-policy`の設定値を動的に`volatile-lru`に設定する: `config set maxmemory-policy volatile-lru`
