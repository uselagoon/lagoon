# DeployTarget設定

DeployTarget設定は、プロジェクトが複数のクラスタにデプロイする方法を定義する方法です。この機能は、本番ワークロードを実行するために専用のクラスタと、開発ワークロードを実行するための別のクラスタがある場合に便利です。

これらの設定は、単に本番/開発の分割に限定されるわけではないため、プロジェクトは特定のクラスタを複数ターゲットにできる可能性があります。

DeployTarget設定の基本的な考え方は、プロジェクトが複数のクラスタ間でどのようにデプロイできるかを簡単に定義する方法であり、環境が有効かどうかを確認する既存の方法を利用します。

## 重要な情報

DeployTarget設定を利用してプロジェクトを設定する方法について説明する前に、知っておくべきことがいくつかあります。

1. 環境にはどのDeployTarget(KubernetesまたはOpenShift)で作成されたかを識別するための新たな2つのフィールドが利用可能になりました。

  1. `kubernetesNamespacePattern`
  2. `kubernetes`

2. 特定のDeployTargetに一度デプロイされた環境は、DeployTarget設定やプロジェクト設定が変更されても、常にこのターゲットにデプロイされます。
  1.   これによりDeployTargetの設定を変更しても、異なるクラスタで新しい環境が作成されることがなくなり、既存の環境に対して一定の安全性を提供できます。
  2. これはLagoonの新機能であり、DeployTarget設定に特化されたものではありません。

3. デフォルトでは、プロジェクトにDeployTargetの設定が関連付けられていない場合、そのプロジェクトは既存の方法を使用してどの環境にデプロイするかを決定します。これには以下のフィールドを使用されます。

  1. `branches`
  2. `pullrequests`
  3. `kubernetesNamespacePattern`
  4. `kubernetes`

4. DeployTargetの設定がプロジェクトに追加されると、今後すべてのデプロイはこれらの設定を使用します。プロジェクトで定義されているものは無視され、DeployTargetの設定が使用されていることをユーザーに通知するために上書きされます。
5. DeployTargetの設定は重み付けされており、これは大きい重みのDeployTarget設定が小さい重みのものより優先されることを意味します。

  1. クエリで返される順序が、環境がデプロイされるべき場所を決定するために使用される順序です。

6. Active/Standby環境は、同じクラスタなので、DeployTarget設定はそれらの環境を同じターゲットにデプロイできるように設定する必要があります。
7. Lagoonの`promote`機能を活用するプロジェクトは、DeployTarget設定が`destination`環境では無視されることに注意する必要があります。

  1. ディスティネーション環境は常に`source`環境がある同じターゲットにデプロイされますので、DeployTarget設定はこの`source`環境に対して正しく設定する必要があります。
  2. 安全のため、`source`と`destination`の環境を同じDeployTarget設定のブランチ正規表現で定義するのがベストです。

## 設定

プロジェクトでDeployTarget設定を使用するよう構成するには、最初のステップとしてプロジェクトに設定を追加します。

以下のGraphQLのミューテーションを使用できます。この特定の例では、プロジェクトID 1のプロジェクトにDeployTarget設定を追加します。
これにより、名前が`main`と一致するブランチのみがデプロイされ、`pullrequests`は`false`に設定されます。
これは、他のブランチがこの特定のターゲットにデプロイすることができず、プルリクエストもこの特定のターゲットにデプロイされないことを意味します。
`deployTarget`はID 1で、これはKubernetesになる可能性があります。 特定の地域や特定の種類のワークロード(製品版または開発版)向けにクラスターを指定します。

```GraphQL title="DeployTargetの設定"
mutation addDeployTargetConfig{
  addDeployTargetConfig(input:{
    project: 1
    branches: "main"
    pullrequests: "false"
    deployTarget: 1
    weight: 1
  }){
    id
    weight
    branches
    pullrequests
    deployTargetProjectPattern
    deployTarget{
        name
        id
    }
    project{
        name
    }
  }
}
```

!!! Info "情報"
    `deployTarget`はLagoon API内のKubernetesまたはOpenShift IDのエイリアスです

また、複数のDeployTarget設定を構成することも可能です。

以下のGraphQLミューテーションを使用できます。この例では、上記と同じプロジェクトにDeployTarget設定を追加します。

これにより、`^feature/|^(dev|test|develop)$` と正規表現がマッチするブランチのみがデプロイされます。そして、`pullrequests` は `true` に設定されているのですべてのプルリクエストがこのターゲットに到達します。

この例では、ターゲットとなるクラスタはID2で、`main`ブランチ上で定義されたものとは全く異なるKubernetesクラスタです。

```GraphQL title="DeployTargetの設定"
mutation addDeployTargetConfig{
  addDeployTargetConfig(input:{
    project: 1
    branches: "^feature/|^(dev|test|develop)$"
    pullrequests: "true"
    deployTarget: 2
    weight: 1
  }){
    id
    weight
    branches
    pullrequests
    deployTargetProjectPattern
    deployTarget{
        name
        id
    }
    project{
        name
    }
  }
}
```

これらがプロジェクトに追加されると、以下のクエリを使用してプロジェクトのすべてのDeployTarget設定を返すことができます。

```GraphQL title="デプロイターゲットを取得する"
query deployTargetConfigsByProjectId{
    deployTargetConfigsByProjectId(project:1){
        id
        weight
        branches
        pullrequests
        deployTargetProjectPattern
        deployTarget{
            name
            id
        }
        project{
            name
        }
    }
}
# result:
{
    "data": {
        "deployTargetConfigsByProjectId": [
        {
            "id": 1,
            "weight": 1,
            "branches": "main",
            "pullrequests": "false",
            "deployTargetProjectPattern": null,
            "deployTarget": {
                "name": "production-cluster",
                "id": 1
            },
            "project": {
                "name": "my-project"
            }
        },
        {
            "id": 2,
            "weight": 1,
            "branches": "^feature/|^(dev|test|develop)$",
            "pullrequests": "true",
            "deployTargetProjectPattern": null,
            "deployTarget": {
                "name": "development-cluster",
                "id": 2
            },
            "project": {
                "name": "my-project"
            }
        }
        ]
    }
}
```
