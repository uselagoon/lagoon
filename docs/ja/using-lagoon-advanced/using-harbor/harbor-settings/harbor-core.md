# ハーバーコア

Harbor-Coreは、コンテナ内の`/etc/core/app.conf`に位置する設定ファイルが必要で、起動します。この設定ファイルに行われる任意の変更は一時的なもので、ポッドが再起動されると持続しません。

この設定ファイルが生成されるConfigmapは、`services/harbor-core/harbor-core.yml`ファイルの中のLagoon内に保存されます。このconfigmapに行われる任意の変更は、コンテナの再起動をまたいで持続します。

## 設定ファイルの内容

* `_REDIS_URL`
  * Redisサーバーへの接続情報をharbor-coreとChartmuseumサービスに伝えます。
  * デフォルト値は`harbor-redis:6379,100,`です。
* `_REDIS_URL_REG`
  * harborregistryがRedisサーバーに接続するために使用するべきURL。
  * デフォルト値は`redis://harbor-redis:6379/2`です。
* `ADMIRAL_URL`
  * admiralサービスの場所をharbor-coreに伝えます。
  * このサービスはLagoonのHarbor実装では**使用されません**。
  * デフォルト値は`NA`です。
* `CFG_EXPIRATION`
  * この値は使用されません。
  * デフォルト値は`5`です。
* `CHART_CACHE_DRIVER`
  * harbor-coreにアップロードされたチャートをどこに保存するかを伝えます。
  * デフォルト値は`redis`です。
* `CLAIR_ADAPTER_URL`
  * harbor-coreが使用すべきURL。 * Harbor-trivyサービスに接続するために使用します。
  * デフォルトの値は `http://harbor-trivy:8080` です。
* `CLAIR_DB`
  * harborclairが使用すべきデータベースのタイプ。
  * この値は使用されず、古いサポートのためだけに含まれています。
  * デフォルトの値は `postgres` です。
* `CLAIR_DB_HOST`
  * この値は使用されず、古いサポートのためだけに含まれています。
  * harbor-coreにharborclairサービスの場所を伝えます。
  * デフォルトの値は `harbor-database` です。
* `CLAIR_DB_PASSWORD`
  * harborclairのpostgresデータベースにアクセスするために使用するパスワード。
  * ローカルで実行するかCIテスト中の場合、デフォルトの値は `test123` です。
  * この値は使用されず、古いサポートのためだけに含まれています。
  * この値は、Harborが初めて稼働するLagoon上で設定された時に作成された秘密から取得されます。
* `CLAIR_DB_PORT`
  * harborclairがharborclairサーバーに接続するために使用すべきポート。
  * この値は使用されず、古いサポートのためだけに含まれています。
  * デフォルトの値は `5432` です。
* `CLAIR_DB_SSLMODE`
  * harborclairがpostgresqlサーバーに接続するためにSSLを使用すべきかどうか。
  * この値は使用されず、古いサポートのためだけに含まれています。
  * デフォルトの値は `disable` です。
* `CLAIR_DB * `USERNAME`
  * ユーザー名harborclairは、postgresqlサーバーに接続するために使用するべきです。
  * この値は使用されず、レガシーサポートのためだけに含まれています。
  * デフォルト値は`postgres`です。
* `CLAIR_HEALTH_CHECK_SERVER_URL`
  * この値は、harbor-coreがharbor-trivyサービスに対して健康チェックを発行する場所を指示します。
  * デフォルト値は`http://harbor-trivy:8080`です。
* `CLAIR_URL`
  * harbor-coreがharbor-trivyサービスに接続するために使用すべきURLです。
  * デフォルト値は`http://harbor-trivy:6060`です。
* `CONFIG_PATH`
  * harbor-coreが設定ファイルを探すべき場所です。
  * デフォルト値は`/etc/core/app.conf`です。
* `CORE_SECRET`
  * この値は、harbor-coreに接続する各種サービス間で一致する必要がある事前共有キーです。
  * デフォルト値は、HarborがローカルやCIテスト中に実行されるときに`secret123`に設定されます。
  * この値は、Harborが初めてLagoonで設定されたときに作成された秘密から取得されます。
* `CORE_URL`
  * harbor-coreが他のHarborサービスに公開し、それらがharbor-coreサービスに接続するためのURLです。
  * デフォルト値は`http://harbor-core:8080`です。
* `DATABASE_TYPE`
  * Harborのデータベースタイプ 使用するべきです。
  * デフォルト値は `postgresql`です。
* `HARBOR_ADMIN_PASSWORD`
  * `admin` ユーザーを使用してharborにアクセスするために使用するべきパスワードです。
  * デフォルト値はローカルで実行する場合やCIテスト中は `admin`です。
  * この値は、Harborが最初にセットアップされた際に作成された秘密から取得されます。
* `HARBOR_NGINX_ENDPOINT`
  * この環境変数は、harborregistryに、そのNGINXイングレスコントローラー、harbor-nginxがどこで稼働しているかを通知し、UI内の適切なプッシュとプルの指示を構築するためなどに使用されます。
  * デフォルト値は、ローカルで実行する場合やCIテスト中は `http://harbor-nginx:8080`に設定されています。
  * Lagoonは、本番環境で実行されるときにこの変数を自動的に取得し設定しようと試みます。そのプロセスが失敗すると、このサービスは実行できません。
* `HTTP_PROXY`
  * デフォルト値は空の文字列です。
* `HTTPS_PROXY`
  * デフォルト値は空の文字列です。
* `JOBSERVICE_SECRET`
  * この値は、harbor-jobserviceに接続する各種サービス間で一致しなければならない事前共有キーです。
  * デフォルト値は、Harborがローカルで実行されるかCIテスト中の場合、`secret123`に設定されています。
  * この値は、Harborが最初に設定された際に作成された秘密から取得されます。 は、Lagoonが動作している状態で初めて設定されます。
* `JOBSERVICE_URL`
  * harbor-coreがharbor-jobserviceサービスに接続するために使用すべきURL。
  * デフォルトの値は`http://harbor-jobservice:8080`です。
* `LOG_LEVEL`
  * harbor-coreサービスのデフォルトのログレベル。
  * デフォルトの値は`error`です。
* `NO_PROXY`
  * リクエストがプロキシされるべきではないホストのリスト。
  * デフォルトは`harbor-core,harbor-jobservice,harbor-database,harbor-trivy,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`です。
* `PORTAL_URL`
  * この値は、サービスがharbor-portalサービスに接続する場所を指示します。
  * デフォルトの値は`http://harbor-portal:8080`です。
* `POSTGRESQL_DATABASE`
  * harbor-coreがpostgresqlサーバーに接続する際に使用すべきpostgresデータベース。
  * デフォルトの値は`registry`です。
* `POSTGRESQL_HOST`
  * harbor-coreがpostgresqlサーバーに接続すべき場所。
  * デフォルトの値は`harbor-database`です。
* `POSTGRESQL_MAX_IDLE_CONNS`
  * harbor-coreがpostgresqlサーバーに対して開放しておくべき最大のアイドル接続数。
  * デフォルトの値は`50`です。
* `POSTGRESQL_MAX_OPEN_CONNS`
  * harbor-coreが開くべき最大の接続数。 -コアはpostgresqlサーバーに接続する必要があります。
  * デフォルト値は`100`です。
* `POSTGRESQL_PASSWORD`
  * Harborがpostgresqlサーバーに接続するために使用すべきパスワード。
  * デフォルト値はランダムに生成された値です。
* `POSTGRESQL_PORT`
  * harbor-coreがpostgresqlサーバーに接続するために使用すべきポート。
  * デフォルト値は`5432`です。
* `POSTGRESQL_USERNAME`
  * harbor-coreがpostgresqlサーバーに接続するために使用すべきユーザー名。
  * デフォルト値は`postgres`です。
* `POSTGRESQL_SSLMODE`
  * harbor-coreがSSLを使用してpostgresqlサーバーに接続すべきかどうか。
  * デフォルト値は`disable`です。
* `REGISTRY_HTTP_SECRET`
  * この値は、harborregistryに接続する各サービス間で一致する必要がある事前共有キーです。
  * デフォルト値は、Harborがローカルで実行されるかCIテスト中に`secret123`に設定されます。
  * この値は、Harborが初めて稼働しているLagoonに設定されたときに生成される秘密から取得されます。
* `REGISTRY_STORAGE_PROVIDER_NAME`
  * harborregistryが使用すべきストレージバックエンド。
  * デフォルト値は`s3`です。
* `REGISTRY_URL`
  * harbor-coreがharborregistryサービスに接続するために使用すべきURL。
  * デフォルト値は * 値は`http://harborregistry:5000`です。
* `REGISTRYCTL_URL`
  * この値は、サービスがharborregistryctlサービスに接続する場所を指定します。
  * デフォルト値は`http://harborregistryctl:8080`に設定されています。
* `ROBOT_TOKEN_DURATION`
  * この値は、各問題のロボットトークンが有効であるべき日数を設定します。
  * デフォルト値は`999`に設定されています。
* `SYNC_REGISTRY`
  * この値は使用されません。
  * デフォルト値は`false`です。
* `TOKEN_SERVICE_URL`
  * harbor-coreサービスが他のサービスに公開するURLで、これによりJWTトークンを取得します。
  * デフォルト値は`http://harbor-core:8080/service/token`です。
* `TRIVY_ADAPTER_URL`
  * harbor-coreサービスがharbor-trivyサービスに接続するために使用するURLです。
  * デフォルト値は`http://harbor-trivy:8080`です。
* `WITH_CHARTMUSEUM`
  * Chartmuseumサービスが使用されているかどうかをharbor-coreに伝えます。
  * このサービスはLagoonのHarbor実装では**使用されません**。
  * デフォルト値は`false`です。
* `WITH_CLAIR`
  * harborclairサービスが使用されているかどうかをharbor-coreに伝えます。
  * LagoonはHarborの実装でこのサービスを**使用します**。
  * デフォルト値は`true`です。
* `WITH_NOTARY`
  * harbor-coreに - ノータリーサービスが使用されている場合のcore。
  * このサービスは、Lagoonが実装したHarborでは**使用されません**。
  * デフォルト値は`false`です。
* `WITH_TRIVY`
  * Trivyサービスが使用されているかどうかをharbor-coreに伝えます。
  * デフォルト値は`true`です。