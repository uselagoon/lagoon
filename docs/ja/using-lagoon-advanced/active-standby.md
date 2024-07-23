# Active/Standby

<iframe width="560" height="315" src="https://www.youtube.com/embed/urq15chLvzQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 設定

既存のプロジェクトをActive/Standbyに対応させるためには、Lagoon APIを使用してプロジェクト設定をいくつか設定する必要があります。

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

`.lagoon.yml`ファイルでプロジェクトをActive/Standbyに設定するためには、`active`環境にアタッチしたいルートと`standby`環境にアタッチしたいルートを`production_routes`セクションに設定する必要があります。Active/Standbyの切り替え時には、これらのルートは2つの環境間で移行します。

`production-brancha`と`production-branchb`の2つの`production`環境があり、現在アクティブな`production`環境が`production-brancha`である場合：

* `production_routes.active`配下のルートは`production-brancha`に向かわせます。
* `production_routes.standby`配下のルート`production-branchb`に向かわせます。

Active/Standbyの切り替え時には、ルートが入れ替わります:

* `production_routes.active`配下のルートは`production-branchb`に向かわせます。
* `production_routes.standby`配下のルートは`production-brancha`に向かわせます。

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

!!! Info "情報"
    `environments..routes`セクション配下にあるルートは、Active/Standbyの一部として移動されません。これらのルートは常に定義された環境にアタッチされます。Active/Standbyの切り替え中に特定のルートを移行する必用がある場合、それらを環境セクションから削除し、Activeまたは、Standbyルート固有の`production_routes` セクションに配置してください。 [ `.lagoon.yml` のルートについて詳しくはこちらを参照してください。](../concepts-basics/lagoon-yml.md#routes)

## 切り替えイベントのトリガー

### UI経由

環境ルートの切り替えをトリガーするには、Lagoon UIで`Standby`環境を訪れ、`Switch Active/Standby environments`というラベルのボタンをクリックします。アクションを確認するように求められます。

確認すると、タスクページに移動し、切り替えの進捗状況を確認することができます。

### API経由

環境を切り替えるイベントをトリガーするには、次のGraphQL mutationを実行します。これにより、Lagoonがプロセスを開始します。

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

切り替えイベントがトリガーされると、現在のアクティブ環境の `tasks` タブにタスクが作成されます。ここで切り替えの状態を確認することができます。

`remoteId` を使用して、`switchActiveStandby` mutationからタスクのステータスを確認することもできます。

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

デフォルトでプロジェクトは以下のエイリアスが作成され、Active/Standbyが有効になっている場合に利用できます。

* `lagoon-production`
* `lagoon-standby`

`lagoon-production`エイリアスは`productionEnvironment`として定義されているサイトを指し、`lagoon-standby`は常に`standbyProductionEnvironment`として定義されているサイトを指します。

これらのエイリアスは、プロジェクトの更新によって設定を変更することができます。ただし、それらを変更すると、それらに依存するスクリプトを更新する必要があることに注意してください。

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

これら2つのブランチのうち、どちらを主な環境として進めていくかを決定する必要があります。その後、 それがアクティブなブランチとして設定されていることを確認してください。(例:`production-branchb`)

1. この現在アクティブなブランチの`.lagoon.yml`ファイルで、`production_routes.active.routes`セクションからルートを`environments.production-branchb`セクションに移動します。これは、そのルートが`production-branchb environment`にのみ関連付けられることを意味します。
2. これが完了したら、`.lagoon.yml`ファイルから完全にproduction_routesセクションを削除し、production-branchb環境を再デプロイできます。
3. もう1つのブランチである`production-brancha`が必要ない場合は削除してもかまいません。
4. Gitにブランチを保持する場合、混乱を避けるためにそのブランチの`.lagoon.yml`からも`production_routes`を削除しておきましょう。このブランチは削除して再デプロイ(すべてのストレージとデータベースなどを消去)するまで`production`タイプとして残ります。
5. プロジェクトが`production-branchb`の`production`環境のみで、他のすべての環境が`development`環境である状態になったら、プロジェクトを更新して`standbyProductionEnvironment`を削除し、環境のActive/Standbyラベルを消去します。

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

Active/Standbyトリガーが実行されたとき、`productionEnvironment`と`standbyProductionEnvironments`はLagoon API内で切り替わります。両方の環境はまだ`production`環境タイプとして分類されています。`productionEnvironment`はどちらが`active`とラベル付けされているかを決定するために使用します。環境タイプの違いについての詳細は、[`environment types`のドキュメント](../concepts-advanced/environment-types.md)をご覧ください。

```graphql title="GraphQLを使って環境を取得する"
query projectByName {
  projectByName(name:"drupal-example"){
    productionEnvironment
    standbyProductionEnvironment
  }
}
```

環境を切り替える前

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

環境を切り替えた後

```graphql title="環境クエリの結果"
{
  "data": {
    "projectByName": {
      "productionEnvironment": "production-branchb",
      "standbyProductionEnvironment": "production-brancha"
    }
  }
}
```
