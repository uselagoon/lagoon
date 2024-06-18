# Lagoonバックアップ

Lagoonは、K8upバックアップオペレーターを使用しています:[https://k8up.io](https://k8up.io)。LagoonはK8upと密接に統合されているわけではありません。むしろ、LagoonはそのリソースをK8upが自動的に発見してバックアップできるように作成できます。

LagoonはK8up 1.xと広範にテストされていますが、まだ2.xとは互換性がありません。1.1.0チャートバージョン(アプリバージョンv1.2.0)の使用を推奨します。

1. ポリシーを持つ新しいAWSユーザーを作成します。

    ```json title="example K8up IAM user"
    {
      "Version":"2012-10-17",
      "Statement":[
        {
          "Sid":"VisualEditor0",
          "Effect":"Allow",
          "Action":[
            "s3:ListAllMyBuckets",
            "s3:CreateBucket",
            "s3:GetBucketLocation"
          ],
          "Resource":"*"
        },
        {
          "Sid":"VisualEditor1",
          "Effect":"Allow",
          "Action":"s3:ListBucket",
          "Resource":"arn:aws:s3:::baas-*"
        },
        {
          "Sid":"VisualEditor2",
          "Effect":"Allow",
          "Action":[
            "s3:PutObject",
            "s3:GetObject",
            "s3:AbortMultipartUpload",
            "s3:DeleteObject",
            "s3:ListMultipartUploadParts"
          ],
          "Resource":"arn:aws:s3:::baas-*/*"
        }
      ]
    }
    ```

2. あなたのプロバイダーに合わせて`k8up-values.yml`を作成します:

    ```yaml title="k8up-values.yml"
    k8up:
      envVars:
        - name: BACKUP_GLOBALS3ENDPOINT
          value: 'https://s3.eu-west-1.amazonaws.com'
        - name: BACKUP_GLOBALS3BUCKET
          value: ''
        - name: BACKUP_GLOBALKEEPJOBS
          value: '1'
        - name: BACKUP_GLOBALSTATSURL
          value: 'https://backup.lagoon.example.com'
        - name: BACKUP_GLOBALACCESSKEYID
          value: ''
        - name: BACKUP_GLOBALSECRETACCESSKEY
          value: ''
        - name: BACKUP_BACKOFFLIMIT
          value: '2'
        - name: BACKUP_GLOBALRESTORES3BUCKET
          value: ''
        - name: BACKUP_GLOBALRESTORES3ENDPOINT
          value: 'https://s3.eu-west-1.amazonaws.com'
        - name: BACKUP_GLOBALRESTORES3ACCESSKEYID
          value: ''
        - name: BACKUP_GLOBALRESTORES3SECRETACCESSKEY
          value: ''
      timezone: Europe/Zurich
    ```

3. K8upをインストール:

    ```bash title="K8upをインストールするステップ1"
    helm repo add appuio https://charts.appuio.ch
    ```

    ```bash title="K8upをインストールするステップ 2"
    kubectl apply -f https://github.com/vshn/k8up/releases/download/v1.2.0/k8up-crd.yaml
    ```

    ```bash title="K8upのインストールステップ3"
    helm upgrade --install --create-namespace \
      --namespace k8up \
      -f k8up-values.yaml \
      --version 1.1.0 \
      k8up appuio/k8up
    ```

4. `lagoon-core-values.yml`を更新します:

   ```yaml title="lagoon-core-values.yml"
   s3BAASAccessKeyID: <<Access Key ID for restore bucket>>
   s3BAASSecretAccessKey: <<Access Key Secret for restore bucket>>
   ```

5. `lagoon-core`を再デプロイします。
