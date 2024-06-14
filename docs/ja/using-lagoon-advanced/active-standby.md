# アクティブ/スタンバイ

<iframe width="560" height="315" src="https://www.youtube.com/embed/urq15chLvzQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 設定

既存のプロジェクトをアクティブ/スタンバイに対応させるためには、Lagoon APIを使用してプロジェクト設定をいくつか設定する必要があります。

* `productionEnviromment`は、現在アクティブな環境のブランチ名に設定する必要があります。
* `standbyProductionEnvironment`は、現在スタンバイ中の環境のブランチ名に設定する必要があります。

```graphql title="プロジェクト設定の更新"
mutation updateProject {
  updateProject(input:{
    id:1234
    patch:{
      productionEnvironment:"production-brancha"
      standbyProductionEnvironment:"production-branchb"
    }
  }){
    standbyProductionEnvironment
    name
    productionEnvironment
  }
}
```

### `.lagoon.yml` - `production_routes`

`.lagoon.yml`ファイルでプロジェクトをアクティブ/スタンバイに設定するためには、`active`環境にアタッチしたいルートと`standby`にアタッチしたいルートを`production_routes`セクションに設定する必要があります。 環境。アクティブ/スタンバイの切り替え時には、これらのルートは2つの環境間で移動します。

もし2つのプロダクション環境、`production-brancha`と`production-branchb`があり、現在アクティブなプロダクション環境が`production-brancha`であるなら：

* `production_routes.active`の下のルートはあなたを`production-brancha`に向かわせます。
* `production_routes.standby`の下のルートはあなたを`production-branchb`に向かわせます。

アクティブ/スタンバイの切り替え時には、ルートが交換されます：

* `production_routes.active`の下のルートはあなたを`production-branchb`に向かわせます。
* `production_routes.standby`の下のルートはあなたを`production-brancha`に向かわせます。

```yaml title=".lagoon.yml"
production_routes:
  active:
    routes:
      - nginx:
        - example.com:
            tls-acme: 'false'
        - active.example.com:
            tls-acme: 'false'
  standby:
    routes:
      - nginx:
        - standby.example.com:
            tls-acme: 'false'
```

!!! 情報
    セクション`environments..routes`の下にあるルートは、アクティブ/スタンバイの一部として移動されません。これらのルートは常に定義された環境に付属しています。特定のルートを必要とする場合は、そのルートが アクティブ/スタンバイ切り替え中に移行した場合、それらを環境セクションから削除し、それがアクティブルートかスタンバイルートであるべきか特定の `production_routes` セクションに配置してください。[ `.lagoon.yml` のルートについて詳しくはこちらを参照してください。](../concepts-basics/lagoon-yml.md#routes)

## 切り替えイベントのトリガー

### UI経由

環境ルートの切り替えをトリガーするには、Lagoon UIでスタンバイ環境を訪れ、`Switch Active/Standby environments`というラベルのボタンをクリックします。アクションを確認するように求められます。

確認されると、スイッチの進行状況を確認することができるタスクページに移動します。

### API経由

環境を切り替えるイベントをトリガーするには、次のGraphQL変異を実行します。これにより、Lagoonがプロセスを開始します。

```graphql title="アクティブスタンバイスイッチ"
mutation ActiveStandby {
  switchActiveStandby(
    input:{
      project:{
        name:"drupal-example"
      }
    }
  ){
    id
    remoteId
  }
}
```

切り替えイベントがトリガーされると、現在のアクティブ環境の `tasks` タブにタスクが作成されます。ここでスイッチの状態を確認することができます。

`switchActiveStandby` 変異からの `remoteId` を使用して、 タスクのステータスも確認することができます。

```graphql title="タスクステータスの確認"
query getTask {
  taskByRemoteId(id: "<remoteId>") {
    id
    name
    created
    started
    completed
    status
    logs
  }
}
```

## `drush`エイリアス

デフォルトでは、プロジェクトは以下のエイリアスが作成され、プロジェクトでアクティブ/スタンバイが有効になっている場合に利用できます。

* `lagoon-production`
* `lagoon-standby`

`lagoon-production`エイリアスは`productionEnvironment`として定義されているサイトを指し、`lagoon-standby`は常に`standbyProductionEnvironment`として定義されているサイトを指します。

これらのエイリアスは、プロジェクトの更新によって設定を変更することができます。ただし、それらを変更すると、それらに依存するスクリプトを更新する必要があるかもしれません。

```graphql title="Drushエイリアスの更新"
mutation updateProject {
  updateProject(input:{
    id:1234
    patch:{
      productionAlias:"custom-lagoon-production-alias"
      standbyAlias:"custom-lagoon-standby-alias"
    }
  }){
    productionAlias
    name
    standbyAlias
  }
}
```

## Active/Standbyの無効化

これら2つのブランチのうち、どちらを主な環境として進めていくかを決定する必要があります。その後、 それがアクティブなブランチとして設定されていることを確認してください（例：`production-branchb`）。

1. この（現在アクティブな）ブランチの`.lagoon.yml`ファイルで、`production_routes.active.routes`セクションからルートを`environments.production-branchb`セクションに移動します。これは、そのルートが`production-branchb environment`にのみ関連付けられることを意味します。
2. これが完了したら、`.lagoon.yml`ファイルから完全にproduction_routesセクションを削除し、production-branchb環境を再デプロイできます。
3. もう他のブランチ`production-brancha`が必要ない場合、それを削除できます。
4. Gitでブランチを保持する場合、混乱を避けるためにそのブランチの`.lagoon.yml`からも`production_routes`を削除するべきです。ブランチは`production`タイプのままになりますが、それを削除して再デプロイしない限り（すべてのストレージとデータベースなどを消去）。
5. プロジェクトが`production-branchb`プロダクション環境だけが存在し、他のすべての環境が`development`である状態になったら、プロジェクトから`standbyProductionEnvironment`を削除して、環境のアクティブ/スタンバイラベルを消去します。

```graphql title="アクティブ/スタンバイをオフにする"
mutation updateProject {
  updateProject(input:{
    id:1234
    patch:{
      productionEnvironment:"production-branchb"
      standbyProductionEnvironment:""
    }
  }){
    standbyProductionEnvironment
    name
    productionEnvironment
  }
}
```

## ノート

アクティブ/スタンバイトリガーが実行されたとき、`productionEnvironment`と`standbyProductionEnvironments`はLagoon API内で切り替わります。両方の環境はまだ`production`環境タイプとして分類されています。`productionEnvironment`はどちらが`active`とラベル付けされているかを決定するために使用します。環境タイプの違いについての詳細は、[`environment types`のドキュメンテーション](../concepts-advanced/environment-types.md)をご覧ください。

```graphql title="GraphQLを使って環境を取得する"
query projectByName {
  projectByName(name:"drupal-example"){
    productionEnvironment
    standbyProductionEnvironment
  }
}
```

環境を切り替える前：

```graphql title="環境クエリの結果"
{
  "data": {
    "projectByName": {
      "productionEnvironment": "production-brancha",
      "standbyProductionEnvironment": "production-branchb"
    }
  }
}
```

環境を切り替えた後：

```graphql title="結果 の環境クエリ"
{
  "data": {
    "projectByName": {
      "productionEnvironment": "production-branchb",
      "standbyProductionEnvironment": "production-brancha"
    }
  }
}
```
