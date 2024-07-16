# Redis

[Lagoon `Redis`イメージDockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis) は、[公式 `redis:alpine`イメージ](https://hub.docker.com/_/redis/)をベースに作成されています。

このDockerfileは、デフォルトでスタンドアロンのRedis _ephemeral_ サーバーをセットアップするために使用することを想定しています。

## サポートされているバージョン { #supported-versions }

* 5(互換性のためのみ利用可能、公式サポートは終了しています) - `uselagoon/redis-5`または`uselagoon/redis-5-persistent`
* 6 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/6.Dockerfile) - `uselagoon/redis-6`または`uselagoon/redis-6-persistent`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/7.Dockerfile) - `uselagoon/redis-7`または`uselagoon/redis-7-persistent`

## 使用方法

Redisイメージには、**Ephemeral(一時的)**と**Persistent(永続的)**の2種類のタイプがあります。

### Ephemeral(一時的)

Ephemeralイメージは、アプリケーションの一時的なキャッシュとして使用されることを想定しており、コンテナを再起動してもデータは保持されません。

メモリ内(RAM)キャッシュとして使用する場合、大きなキャッシュを扱う場合は、最初に調整したいのが`MAXMEMORY`変数です。この変数は、Redisがキャッシュされたアイテムを保存するために使用するメモリ(RAM)の最大量を制御します。

### Persistent (永続的)

PersistentなRedisイメージは、コンテナを再起動してもデータを保持し、キューや永続化が必要なアプリケーションデータに使用できます。

Redisコンテナが再起動してディスクからデータを読み込む間はアプリケーションに予期しない副作用が生じる可能性があるため、通常はメモリ内キャッシュのシナリオでPersistent Redisを使用するようにはお勧めしません。

## Lagoonの適応 { #lagoon-adaptions }

このイメージはLagoonで使用されることを想定して準備されています。そのため、すでにいくつかのことが行われています:

* フォルダの権限は、[`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions)で自動的に適応されるため、このイメージはランダムなユーザーで動作します。
* `/etc/redis/*`内のファイルは、コンテナエントリーポイントを通して[`envplate`](https://github.com/kreuzwerker/envplate)を使用してテンプレート化されています。

## `redis.conf` 設定ファイル

このイメージには、Lagoonで動作するように最適化された _デフォルト_ のRedis設定ファイルが含まれています。

### 環境変数 { #environment-variables }

一部のオプションは[環境変数](../concepts-advanced/environment-variables.md)で設定可能です。

| 環境変数 | デフォルト     |                                         説明                                         |
| :------------------- | :---------- | :----------------------------------------------------------------------------------------- |
| データベース            | -1          | 起動時に作成されるデータベースのデフォルト数(-1は無制限)                                            |
| ログレベル             | 通知      | ログのレベルを定義します                                                                  |
| 最大メモリ使用量            | 100mb       | 最大メモリ容量                                                                  |
| 最大メモリポリシー            | allkeys-lru | Redisが最大メモリ使用量に達したときにキーを追い出すためのポリシー            |
| REDIS_PASSWORD       | 無効    | [認証機能](https://redis.io/topics/security#authentication-feature)を有効にします。 |

## カスタム設定

ベースイメージに基づいて、カスタム設定を含めることができます。
Redis設定ファイルの詳細なドキュメントについては、[こちら](https://github.com/redis/redis/blob/7.2.5/redis.conf)を参照ください。

## Redis 永続化

[Lagoonの `redis`イメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/redis/6.Dockerfile)をベースにした[Lagoonの `redis-persistent` Dockerイメージ](https://github.com/uselagoon/lagoon-images/blob/main/images/redis-persistent/6.Dockerfile)は、Redisサービスを`persistent`モードで使用する場合(つまり、キーがディスクに保存される永続化ボリュームを使用する場合)に使用されます。

`redis`との違いは、`FLAVOR`環境変数のみです。これは、使用されるredisのバージョンに応じて、[それぞれのRedis設定](https://github.com/uselagoon/lagoon-images/tree/main/images/redis/conf)を使用します。

## トラブルシューティング

LagoonのRedisイメージにはすべて`redis-cli`コマンドが事前にロードされています。これを使用して、Redis サービスに情報を問い合わせたり、設定値を動的に設定することができます。このユーティリティを使用するには、[ここ](../interacting/ssh.md)の手順を使用して、`pod`値として`redis`を指定してRedisポッドにSSHで接続し、接続したらターミナルから実行するだけです。

### 最大メモリポリシー

デフォルトでは、Lagoon`redis`イメージは`allkeys-lru`ポリシーを使用するように設定されています。このポリシーは、Redisサービスが`maxmemory`制限に達した場合、最後に使用されたキーから順に、Redisに保存されている**任意の**キーを追い出すことを許可します。

一般的なインストールでは、DrupalがRedisにキャッシュされた各キーに`TTL`値を設定しない場合があるため、これが理想的な設定です。`maxmemory-policy`が`volatile-lru`のようなものに設定されていて、Drupalがこれらの`TTL`タグを提供しない場合、Redisコンテナがいっぱいになり、**任意の**キーの追い出しが完全にできなくなり、新しいキャッシュキーの受け入れも完全に停止してしまいます。

Redisのmaxmemoryポリシーについての詳細情報は、Redisの[公式ドキュメント](https://redis.io/docs/manual/eviction/#eviction-policies)を参照して下さい。

!!! Danger "注意して進めてください"
    この設定を変更すると、Redisが完全にいっぱいになり、結果として障害が発生する可能性があります。

### Redisの`maxmemory`値の調整

Redisに割り当てる最適なメモリ量を見つけるのは、なかなか難しい作業です。Redisキャッシュのメモリサイズを調整する前に、通常通りの使用で、少なくとも1日間は通常通りに実行させるのが賢明です。

これらのメモリ値を調整する際に、いくつかの高レベルなポイントがあります：

* 最初に確認するべきことは 現在Redisが使用しているメモリの割合です。
  * この割合が`50％`未満の場合は、`maxmemory`の値を25％減らすことを検討してください。
  * この割合が`50％`から`75％`の間であれば、問題なく稼働しています。
  * この値が`75％`を超える場合、`maxmemory`を増やす必要があるかどうか、他の変数を確認する価値があります。
* Redisのメモリ使用率が高いと判断した場合、次にキーの追い出し回数を確認して下さい。
  * キーの追い出し回数が多く、メモリ使用率が`95％`を超えている場合は、Redisの`maxmemory`設定を高くする必要があることを示しています。
  * キーの追い出し回数が多くないようで、応答時間が妥当な場合は、単に Redis が割り当てられたメモリを想定通りに管理していることを示しています。

### コマンド例

以下のコマンドを使用して、Redisサービスに関する情報を取得できます:

* Redisサービスに関するすべての情報を表示:`redis-cli info`
* サービスのメモリ情報を表示:`redis-cli info memory`
* サービスのキースペース情報を表示:`redis-cli info keyspace`
* サービスの統計情報を表示:`redis-cli info stats`

Redisサービスの値を、Redisサービスを再起動せずに動的に設定することもできます。 ただし、これらの動的に設定された値は、ポッドが再起動した場合 (デプロイ、メンテナンス、または単にノード間でシャッフルされた場合に発生する可能性があります) には永続化されないことに注意してください。

* `maxmemory`設定値を動的に`500mb`に設定: `config set maxmemory 500mb`
* `maxmemory-policy`設定値を動的に`volatile-lru`に設定: `config set maxmemory-policy volatile-lru`
