# Harbor-データベース

Harbor-データベースは起動するために特定の環境変数を設定する必要があり、それらは`services/harbor-database/harbor-core.yml`ファイルで説明されているようにシークレット内に保存されます。

## 設定ファイルの内容

* **`POSTGRES_DB`**
  * Postgresサービスを初期化する際に設定されるデフォルトのデータベース。
  * デフォルト値は`postgres`です。
* **`POSTGRES_PASSWORD`**
  * Postgresデータベースのルートパスワード。
  * デフォルト値は`test123`です。
  * この値は、Harborが動作しているLagoon上で初めて設定されたときに作成されたシークレットから取得されます。
* **`POSTGRES_USER`**
  * Postgresサービスを初期化する際に設定されるデフォルトのユーザー。
  * デフォルト値は`postgres`です。