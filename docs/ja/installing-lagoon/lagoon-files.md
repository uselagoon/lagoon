# Lagoonファイル

Lagoonファイルは、バックアップなどのタスクのファイル出力を保存するために使用され、S3互換ストレージにホストできます。

1. ポリシーを持つ新しいAWSユーザーを作成します:

    ```json title="例:ファイルIAMユーザー"
    {
      "Version":"2012-10-17",
      "Statement":[
        {
          "Effect":"Allow",
          "Action":[
            "s3:ListBucket",
            "s3:GetBucketLocation",
            "s3:ListBucketMultipartUploads"
          ],
          "Resource":"arn:aws:s3:::S3_BUCKET_NAME"
        },
        {
          "Effect":"Allow",
          "Action":[
            "s3:PutObject",
            "s3:GetObject",
            "s3:DeleteObject",
            "s3:ListMultipartUploadParts",
            "s3:AbortMultipartUpload"
          ],
          "Resource":"arn:aws:s3:::S3_BUCKET_NAME/*"
        }
      ]
    }
    ```

2. `lagoon-core-values.yml`を更新します:

    ```yaml title="lagoon-core-values.yml"
    s3FilesAccessKeyID: <<アクセスキーID>>
    s3FilesBucket: <<Lagoonファイル用のバケット名>>
    s3FilesHost: <<S3エンドポイント(例:"https://s3.eu-west-1.amazonaws.com")>>
    s3FilesSecretAccessKey: <<アクセスキーシークレット>>
    s3FilesRegion: <<S3リージョン>>
    ```

3. もしもあなたが `lagoon-core`の前に`ingress-nginx`を使用することを提案します。これにより、より大きなファイルのアップロードが可能になります:

    ```yaml title="lagoon-core-values.yml"
    controller:
    config:
      client-body-timeout: '600' # 最大600秒のファイルアップロード
      proxy-send-timeout: '1800' # 最大30分の接続 - ウェブソケットに必要
      proxy-read-timeout: '1800' # 最大30分の接続 - ウェブソケットに必要
      proxy-body-size: 1024m # 1GBファイルサイズ
      proxy-buffer-size: 64k # 大きなバッファ
    ```
