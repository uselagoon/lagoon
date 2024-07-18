# Harborをインストール

1. Helmリポジトリを追加します:

    ```bash title="Helmリポジトリを追加"
    helm repo add harbor https://helm.goharbor.io
    ```

2. あなたの特定の状況に最適なHarborの設定を考慮してください - 詳細な推奨事項については[彼らのドキュメント](https://goharbor.io/docs/latest/install-config/harbor-ha-helm/#configuration)を参照してください:

  1. 画像のblob(`imageChartStorage`)にはS3互換のストレージの使用を推奨します。
  2. Postgresサービス(`database.type`)にはマネージドデータベースサービスの使用を推奨します。
  3. 高負荷シナリオでは、マネージドRedisサービス(`redis.type`)の使用を推奨します。

3. 設定ディレクトリ内に`harbor-values.yml`ファイルを作成します。プロキシバッファリングの注釈は大きな画像のプッシュに役立ちます:

    ```yaml title="harbor-values.yml"
    expose:
      ingress:
        annotations:
          kubernetes.io/tls-acme: "true"
          nginx.ingress.kubernetes.io/proxy-buffering: "off"
          nginx.ingress.kubernetes.io/proxy-request-buffering: "off"
        hosts:
          core: harbor.lagoon.example.com
      tls:
        enabled: true
        certSource: secret
        secret:
          secretName: harbor-harbor-ingress
    externalURL: https://harbor.lagoon.example.com
    harborAdminPassword: <あなたのHarbor管理者パスワード>
    chartmuseum:
      enabled: false
    clair:
      enabled: false
    notary:
      enabled: false
    trivy:
      enabled: false
    jobservice:
      jobLogger: stdout
    ```

4. 現在サポートされているHarborバージョンの[要件](./requirements.md#harbor)を確認しながら、Harborをインストールします。

    ```bash title="Harborのインストール"
    helm upgrade --install --create-namespace \
      --namespace harbor --wait \
      -f harbor-values.yml \
      harbor harbor/harbor
    ```

5. `harbor.yml`で設定したURLでHarborを訪れます。

  1. ユーザー名:admin
  2. パスワード:

  ```bash title="Harborのシークレットを取得"
  kubectl -n harbor get secret harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode
  ```

6. 次のステップのLagoon Remote `values.yml`と`harbor-values.yml`に上記のHarborの資格情報を追加する必要があります。
