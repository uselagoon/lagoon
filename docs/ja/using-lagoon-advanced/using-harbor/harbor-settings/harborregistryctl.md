# HarborRegistryCtl

HarborRegistryCtlは起動するために設定ファイルを必要とし、その設定ファイルはコンテナ内の`/etc/registryctl/config.yml`に位置しています。この設定ファイルへの変更は一時的なものであり、ポッドが再起動されると持続しません。

この設定ファイルが生成される元となるconfigmapは、Lagoon内の`services/harborregistryctl/harborregistry.yml`ファイルに保存されています。このconfigmapへの変更は、コンテナが再起動されても保持されます。

## 設定ファイルの内容

* **`CORE_SECRET`**
  * この値は、`harbor-core`に接続する各種サービス間で一致する必要がある事前共有キーです。
  * デフォルト値は、Harborがローカルで実行されたりCIテスト中に設定される`secret123`です。
  * この値は、Harborが稼働中のLagoonに初めて設定された際に作成されるシークレットから取得されます。
* **`JOBSERVICE_SECRET`**
  * この値は、`harbor-jobservice`に接続する各種サービス間で一致する必要がある事前共有キーです。
  * デフォルト値は、Harborがローカルで実行されたりCIテスト中に設定される`secret123`です。
  * この値は、Harborが稼働中のLagoonに初めて設定された際に作成されるシークレットから取得されます。
* **`REGISTRY_HTTP_SECRET`**
  * この値は、 `harborregistry`に接続する各種サービス間で一致しなければならない事前共有キー。
  * デフォルト値は、HarborがローカルまたはCIテスト中に実行されるときに`secret123`に設定されます。
  * この値は、Harborが動作中のLagoonに初めて設定されたときに作成された秘密から取得されます。
* **`REGISTRY_REDIS_PASSWORD`**
  * この環境変数は、`harborregistryctl`にRedisに接続するために使用すべきパスワードを伝えます。
  * デフォルト値は空文字列です。