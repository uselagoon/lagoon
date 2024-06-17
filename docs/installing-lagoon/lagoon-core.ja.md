# Lagoon Coreのインストール

## Helmチャートのインストール

1. Lagoon ChartsリポジトリをHelmリポジトリに追加します:

    ```bash title="Lagoon Chartsリポジトリの追加"
    helm repo add lagoon https://uselagoon.github.io/lagoon-charts/
    ```

2. 作成する設定ファイルのディレクトリを作成し、バージョン管理されていることを確認します。`values.yml`ファイルを参照するコマンドでこのパスを参照してください。
3. 作成したディレクトリに`values.yml`を作成します。エンドポイントURLを更新します（それらを`api.lagoon.example.com`からあなたの値に変更します）。
   例: [https://github.com/uselagoon/lagoon-charts/blob/main/charts/lagoon-core/ci/linter-values.yaml](https://github.com/uselagoon/lagoon-charts/blob/main/charts/lagoon-core/ci/linter-values.yaml)
4. 次に、`values.yml`を指定して`helm upgrade --install`コマンドを実行します。以下のようになります:

    ```bash title="values.ymlを使用してHelmをアップグレード"
    helm upgrade --install --create-namespace --namespace lagoon-core -f values.yml lagoon-core lagoon/lagoon-core`
    ```

5. Lagoon Coreがインストールされました！

!!! 警告
    時々、Docker Hubのプル制限に遭遇します。これが続く場合は、私たちのイメージを他の場所に移動することを検討しています。 Translation request timed out. -core-keycloak -o jsonpath="{.data.KEYCLOAK_LAGOON_ADMIN_PASSWORD}" | base64 --decode
    ```
