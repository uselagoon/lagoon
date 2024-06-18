# HarborRegistry

HarborRegistryは、起動に設定ファイルを必要とし、その設定ファイルはコンテナ内の `/etc/registry/config.yml` に位置しています。この設定ファイルへの変更は一時的なものであり、ポッドが再起動されると持続しません。

この設定ファイルは `services/harborregistry/harborregistry.yml` ファイル内に保存され、 `/etc/registry/pre-config.yml` としてコンテナ内にロードされます。

カスタムコンテナエントリーポイント `services/harborregistry/entrypoint.sh` は、提供された環境変数をこの設定ファイルに転送し、結果を `/etc/registry/config.yml` として保存します。

## 設定ファイルの内容

* **`CORE_SECRET`**
  * この値は、`harbor-core` に接続する様々なサービス間で一致しなければならない事前共有キーです。
  * デフォルトの値は、Harborがローカルで実行されたりCIテスト中に設定される `secret123` です。
  * この値は、Harborが実行中のLagoonに初めてセットアップされたときに作成されるシークレットから取得されます。
* **`HARBOR_NGINX_ENDPOINT`**
  * この環境変数は、`harborregistry`に、そのNGINXイングレスコントローラー `harbor-nginx`がどこで実行されているかを通知し、UI内で適切なプッシュとプルの指示を構築するため、その他の事項を通知します。
  * デフォルトの値が設定されています ローカルで実行したりCIテスト中には、`http://harbor-nginx:8080`になります。
  * プロダクション環境でLagoonが自動的にこの変数を取得しセットしようとします。そのプロセスに失敗すると、このサービスは実行に失敗します。
* **`JOBSERVICE_SECRET`**
  * この値は、`harbor-jobservice`に接続する各種サービス間で一致しなければならない事前共有キーです。
  * デフォルト値は、Harborがローカルで実行されるかCIテスト中に`secret123`に設定されます。
  * この値は、Harborが最初に稼働中のLagoon上に設定されたときに作成された秘密から取得されます。
* **`REGISTRY_HTTP_SECRET`**
  * この値は、`harborregistry`に接続する各種サービス間で一致しなければならない事前共有キーです。
  * デフォルト値は、Harborがローカルで実行されるかCIテスト中に`secret123`に設定されます。
  * この値は、Harborが最初に稼働中のLagoon上に設定されたときに作成された秘密から取得されます。
* **`REGISTRY_REDIS_PASSWORD`**
  * この環境変数は、`harborregistryctl`がRedisに接続するために使用すべきパスワードを指示します。
  * デフォルト値は空の文字列です。