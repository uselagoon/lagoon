# Harbor-Trivy

Harbor-Trivyは特定の環境変数を介して設定され、設定ファイルは使用しません。

## 環境変数

* `SCANNER_LOG_LEVEL`
  * このサービスが使用するログレベル。
  * デフォルト値は`error`です。
    * 非常に詳細なログを有効にするには、これを`debug`に設定できます。
* `SCANNER_STORE_REDIS_URL`
  * この値はharbor-trivyに、自身のRedisストアへの接続方法を指示します。
  * デフォルト値は`redis://harbor-redis:6379/4`です。
* `SCANNER_JOB_QUEUE_REDIS_URL`
  * この値はharbor-trivyに、自身のRedisストアへの接続方法を指示します。
  * デフォルト値は`redis://harbor-redis:6379/4`です。
* `SCANNER_TRIVY_VULN_TYPE`
  * この値はharbor-trivyに、何タイプの脆弱性を検索すべきかを指示します。
  * デフォルト値は`os,library`です。