# ローカルでのHarborの実行

Lagoonは、Harborをローカルで実行することをサポートしています。ここでは、AWS S3と互換性のあるローカルストレージソリューションであるMinIOをストレージバックエンドとして利用します。

## 設定

Harborは複数のコンテナで構成されており、それぞれが成功裏に実行するためには異なる設定が必要です。

## 環境変数

Harborが正しく開始するためには、以下の環境変数が設定されている必要があります：

* `HARBOR_REGISTRY_STORAGE_AMAZON_BUCKET`
  * これは、Harborがイメージを保存するAWSバケットの名前に設定する必要があります。
  * Lagoonがローカルで実行される場合やCIテスト中は、デフォルトで`harbor-images`に設定されます。
* `HARBOR_REGISTRY_STORAGE_AMAZON_REGION`
  * これは、Harborのバケットが存在するAWS地域に設定する必要があります。
  * Lagoonがローカルで実行される場合やCIテスト中は、デフォルトで`us-east-1`に設定されます。
* `REGISTRY_STORAGE_S3_ACCESSKEY`
  * これは、HarborがAWSバケットに読み書きするために使用するAWSアクセスキーに設定する必要があります。
  * Lagoonがローカルで実行される場合やCIテスト中は、MinIOは認証を必要としないため、デフォルトで空文字列に設定されます。
* `REGISTRY_STORAGE_S3_SECRETKEY`
  * これは、HarborがAWSバケットにアクセスするために使用するAWSシークレットキーに設定する必要があります。 AWSバケットへの読み書き。
  * Lagoonがローカルで実行されるかCIテスト中の場合、MinIOは認証を必要としないためデフォルトで空文字列になります。

必要に応じて次の環境変数を設定できます：

* `HARBOR_REGISTRY_STORAGE_AMAZON_ENDPOINT`
  * この変数が設定されている場合、Harborレジストリはその値をs3エントリポイントのアドレスとして使用します。
  * この変数が設定されていない場合のデフォルトは `https://s3.amazonaws.com` です。

## コンテナ固有の設定

次のコンテナは設定ファイルを使用します：

* [HarborRegistry](harborregistry.md)
* [HarborRegistryCtl](harborregistryctl.md)
* [Harbor-Core](harbor-core.md)
* [Harbor-Database](harbor-database.md)
* [Harbor-Jobservice](harbor-jobservice.md)
* [Harbor-Trivy](harbor-trivy.md)

次のコンテナは設定ファイルを必要とせずに実行できます：

* Harbor-Nginx
* Harbor-Portal
* Harbor-Redis