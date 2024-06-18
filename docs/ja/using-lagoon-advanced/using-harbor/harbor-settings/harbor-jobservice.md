# Harbor-Jobservice

Harbor-Jobserviceは、起動に設定ファイルを必要とします。これはコンテナ内の`/etc/jobservice/config.yml`に位置しています。この設定ファイルへの変更は一時的なもので、ポッドが再起動されると持続しません。

この設定ファイルが生成される元となるconfigmapは、Lagoon内の`services/harbor-jobservice/harbor-jobservice.yml`ファイルに保存されています。このconfigmapへの変更は、コンテナの再起動を越えて持続します。

## 設定ファイルの内容

* **`CORE_URL`**
  * この値は`harbor-jobservice`に`harbor-core`がどこにあるかを伝えます。
  * デフォルト値は`http://harbor-core:8080`です。
* **`CORE_SECRET`**
  * この値は、`harbor-core`に接続する各種サービス間で一致しなければならない事前共有キーです。
  * デフォルト値は、HarborがローカルまたはCIテスト中に実行されるときに`secret123`に設定されます。
  * この値は、Harborが実行中のLagoon上で初めて設定されたときに作成された秘密から取得されます。
* **`HTTP_PROXY`**
  * デフォルト値は空の文字列です。
* **`HTTPS_PROXY`**
  * デフォルト値は空の文字列です。
* **`JOBSERVICE_SECRET`**
  * この値は、各種サービス間で一致しなければならない事前共有キーです。 `harbor-jobservice`に接続します。
  * デフォルト値は、Harborがローカルで実行されているか、CIテスト中の場合は`secret123`に設定されています。
  * この値は、Harborが実行中のLagoonに初めて設定されたときに作成された秘密から取得されます。
* **`LOG_LEVEL`**
  * このサービスが使用するログレベルです。
  * デフォルト値は`error`です。
    * 非常に詳細なログを有効にするには、`debug`に設定することもできます。
* **`NO_PROXY`**
  * そのリクエストがプロキシ化されるべきではないホストのリスト。
  * デフォルトは `harbor-core,harbor-jobservice,harbor-database,harbor-trivy,harborregistry,harbor-portal,127.0.0.1,localhost,.local,.internal`です。
* **`REGISTRY_CONTROLLER_URL`**
  * この値は、サービスが`harborregistryctl`サービスに接続する場所を指示します。
  * デフォルト値は `http://harborregistryctl:8080`に設定されています。
* **`SCANNER_LOG_LEVEL`**
  * スキャニングサービスが使用するログレベルです。
  * デフォルト値は`error`です。
    * 非常に詳細なログを有効にするには、`debug`に設定することもできます。
* **`SCANNER_STORE_REDIS_URL`**
  * この値は、`harbor-trivy`がRedisストアに接続する方法を指示します。
  * デフォルト値は `redis://harbor-redis:6379/4`です。