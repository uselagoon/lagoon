# Lagoon Coreのインストール

## Helmチャートのインストール { #install-the-helm-chart }

1. Lagoon ChartsリポジトリをHelmリポジトリに追加します:

    ```bash title="Lagoon Chartsリポジトリの追加"
    helm repo add lagoon https://uselagoon.github.io/lagoon-charts/
    ```

2. 作成する設定ファイルのディレクトリを作成し、バージョン管理されていることを確認します。`values.yml`ファイルを参照するコマンドでこのパスを参照してください。
3. 作成したディレクトリに`values.yml`を作成します。エンドポイントURLを更新します(それらを`api.lagoon.example.com`からあなたの値に変更します)。
   例: [https://github.com/uselagoon/lagoon-charts/blob/main/charts/lagoon-core/ci/linter-values.yaml](https://github.com/uselagoon/lagoon-charts/blob/main/charts/lagoon-core/ci/linter-values.yaml)
4. 次に、`values.yml`を指定して`helm upgrade --install`コマンドを実行します。以下のようになります:

    ```bash title="values.ymlを使用してHelmをアップグレード"
    helm upgrade --install --create-namespace --namespace lagoon-core -f values.yml lagoon-core lagoon/lagoon-core`
    ```

5. Lagoon Coreがインストールされました！

!!! Warning "警告"
    時々、Docker Hubのプル制限に遭遇します。これが続く場合は、私たちのイメージを他の場所に移動することを検討しています。

## Keycloak を構成する { #configure-keycloak }

Keycloak の `values.yml` で定義した URL で Keycloak ダッシュボードにアクセスします。

1. 「管理コンソール」をクリックします
2. ユーザー名: `admin`
3. パスワード: `lagoon-core-keycloak` シークレット、キー値 `KEYCLOAK_ADMIN_PASSWORD` を使用します
4. 次のようにシークレットを取得します:
```bash title="シークレットを取得"
kubectl -n lagoon-core get secret lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_ADMIN_PASSWORD}" | base64 --decode
```
5. 右上の **ユーザー** をクリックします。

    1. **アカウントの管理** に移動します。

    2. 作成した管理者アカウントの **メール** を追加します。

    3. 保存します。

6. **Realm Lagoon** -> **Realm Settings** -> **Email** に移動します。

    1. Keycloak のメール サーバーを設定し、「Test connection」ボタンで接続をテストします。

7. **Realm Lagoon** -> **Realm Settings** -> **Login** に移動します。

    1. 「Forgot Password」を有効にします。

    2. 保存します。


## UI にログインします。 { #log-in-to-the-ui }

これで、UI の `values.yml` で定義した URL で Lagoon UI にアクセスできるはずです。

1. ユーザー名: `lagoonadmin`
2. シークレット: `lagoon-core-keycloak` シークレット キー値: `LAGOON-CORE-KEYCLOAK` を使用します。
3. シークレットを取得します。
    ```bash title="秘密を取得する"
        kubectl -n lagoon-core get secret lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_LAGOON_ADMIN_PASSWORD}" | base64 --decode
    ```
