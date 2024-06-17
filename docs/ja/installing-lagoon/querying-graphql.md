# GraphQLでのクエリ

1. GraphQLクエリの送受信にはアプリが必要です。GraphiQLを推奨します。

  1. Homebrewを使用している場合、`brew install --cask graphiql`でインストールできます。

2. Lagoon CoreにKubernetesクラスタについて通知する必要があります。GraphQLエンドポイントは次のとおりです:`https://<YOUR-API-URL>/graphql`
3. **HTTPヘッダーを編集**に移動し、**ヘッダーを追加**します。

  1. ヘッダー名:`Authorization`
  2. 値:`Bearer YOUR-TOKEN-HERE`
  3. ホームディレクトリにLagoon CLIが`.lagoon.yml`ファイルを作成しています。そのファイルからトークンをコピーして、ここでの値に使用します。
  4. 保存。

4. これでクエリを実行する準備が整いました。次のテストクエリを実行して、すべてが正しく動作していることを確認します:

    ```graph title="Get all projects"
    query allProjects {allProjects {name } }
    ```

5. これにより、次のレスポンスが得られるはずです:

  ```graph title="API Response"
    {
      "data": {
        "allProjects": []
      }
    }
  ```

  [詳細については、ドキュメンテーションのGraphQLについてのページをご覧ください。](../interacting/graphql.md)

6. 正しいレスポンスが得られたら、変異を追加する必要があります。

  1. 次のクエリを実行します:

    ```graphql title="突然変異を追加"
    mutation addKubernetes {
 ```bash
      addKubernetes(input:
      {
        name: "<TARGET-NAME-FROM-REMOTE-VALUES.yml>",
        consoleUrl: "<URL-OF-K8S-CLUSTER>",
        token: "xxxxxx”
        routerPattern: "${environment}.${project}.lagoon.example.com"
      }){id}
    }
    ```

    1. `name`: `lagoon-remote-values.yml`から取得
    2. `consoleUrl`: KubernetesクラスタのAPIエンドポイント。`values.yml`から取得
    3. `token`: `ssh-core`サービスアカウント用のトークンを取得

      ```bash title="トークンを取得"
      kubectl -n lagoon get secret/lagoon-remote-ssh-core-token -o json | jq -r '.data.token | @base64d'
      ```

!!! Info "情報"
    GraphQLの認証トークンの有効期限は非常に短いため、新しいトークンを生成する必要があるかもしれません。`lagoon login`を実行し、新しいトークンを取得するために`.lagoon.yml`ファイルをcatコマンドで表示し、HTTPヘッダーの古いトークンを新しいものに置き換えてください。
