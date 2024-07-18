# カスタムタスク

Lagoonでは、環境、プロジェクト、グループレベルでカスタムタスクを定義することができます。現在、これはGraphQL APIを通じて行われ、UIで公開されています。

## カスタムタスクの定義

タスクを定義する際には、いくつかのことを決定する必要があります。

### どのタスクを実行しますか？

ほとんどの場合、実行するカスタムタスクは、アプリケーションのコンテナの一つでシェルで実行されるものです。

例えば、Node.jsアプリケーションでは、`node`コンテナで`yarn audit`を実行することに興味があるかもしれません。この場合、コマンドは単純に`yarn audit`となります。

### このタスクはどこで実行されますか？

このタスクがどこで実行されるかを定義する必要があります -- これは二つのことを意味します。まず、どのプロジェクトまたは環境でタスクを実行するか、そして、どのサービスで行うかです。

たとえば、`yarn audit`タスクを特定のプロジェクト(この例ではプロジェクトのIDを42としましょう)の任意の環境で実行可能にしたいと考えているとしましょう。そのため、タスク定義を作成する際には、下記で説明するように、プロジェクトのIDを指定します。

2つ目の質問は、どの環境をタスクの対象とするかということです。あなたが設定するときに あなたのプロジェクトを設定する際に、[`docker-compose.yml`](../concepts-basics/docker-compose-yml.md)でいくつかのサービスを指定します。このサービス名を使用して、コマンドが実際にどこで実行されるかを決定します。

### このタスクを実行できるのは誰ですか？

タスクシステムへのアクセス権はプロジェクトロールに対応した3つのレベルがあります。ゲスト、デベロッパー、メンテナー -- 最も制限的なものから最も制限の少ないものまで、各ロールはそれより下のロールで定義されたタスクを呼び出すことができます(デベロッパーはゲストのタスクを見ることができ、メンテナーはすべてのタスクを見ることができます)。

## タスクの定義

タスクは`addAdvancedTaskDefinition`ミューテーションを呼び出すことで定義されます。重要なことは、これは単にタスクを_定義するだけで、それを呼び出すわけではありません。それは単にそれを環境で実行可能にするだけです。

概念的には、呼び出しは次のようになります。

```graphql title="新しいタスクを定義する"
mutation addAdvancedTask {
    addAdvancedTaskDefinition(input:{
    name: string,
    confirmationText: string,
    type: [COMMAND|IMAGE],
    [project|environment]: int,
    description: string,
    service: string,
    command: string,
    advancedTaskDefinitionArguments: [
      {
        name: "ENVIROMENT_VARIABLE_NAME",
        displayName: "Friendly Name For Variable",
        type: [STRING | ENVIRONMENT_SOURCE_NAME | ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF]
      }
    ]
  }) {
    ... on AdvancedTaskDefinitionImage {
      id
      name
      description
      service
      image
      confirmationText
      advancedTaskDefinitionArguments {
        type
        range
        name
        displayName
      }
      ...
    }
    ... on AdvancedTaskDefinitionCommand {
      id
      name
      description
      service
      command
      advancedTaskDefinitionArguments {
        type
        range
        name
        displayName
      }
      ...
    }
  }
}
```

フィールド`name`と`description`は直訳です。これらは主にUIで使用されるタスクの名前と説明です。

`type`フィールドについては説明が必要です - 現時点では、プラットフォーム管理者のみが`IMAGE`タイプのコマンドを定義できます - これは、既存のサービスを対象にするのではなく、特定のタスクイメージをタスクとして実行することを可能にします。しかし、ほとんどのタスクは`COMMAND`タイプになります。

`[project|environment]`フィールドのセットは、タスクを`project`または`environment`に関連付ける(使用するキーによります)ことで、その値が id. 私たちが`yarn audit`のために考えているケースでは、IDが`42`の`project`を対象としていることを明示します。

私たちがタスクでターゲットにしたいサービスを`service`フィールドに置き、`command`は私たちが実行したい実際のコマンドです。

### タスクに渡される引数

Lagoon UI経由でタスクを呼び出すユーザーにより柔軟性を提供するために、タスク引数の定義をサポートしています。これらの引数はテキストボックスまたはドロップダウンとして表示され、タスクを呼び出すために必要です。

以下は、2つの引数を設定する方法の例です。

```graphql title="タスク引数の定義"
advancedTaskDefinitionArguments: [
      {
        name: "ENV_VAR_NAME_SOURCE",
        displayName: "Environment source",
        type: ENVIRONMENT_SOURCE_NAME

      },
      {
        name: "ENV_VAR_NAME_STRING",
        displayName: "Echo value",
        type: STRING
        }
    ]
  })
```

このフラグメントは、システムが現在サポートしている両方のタイプの引数を示しています。
最初の`ENV_VAR_NAME_SOURCE`は`ENVIRONMENT_SOURCE_NAME`タイプの例で、これはUIのユーザーにプロジェクト内の異なる環境のドロップダウンを提示します。もし私たちが許可したくない場合は、 呼び出し環境で実行するタスク(例えば、他の環境からデータベースをインポートしたい場合など)については、`ENVIRONMENT_SOURCE_NAME_EXCLUDE_SELF`を使用して環境リストを制限することができます。
二つ目の`ENV_VAR_NAME_STRING`は`STRING`型で、ユーザーにテキストボックスを記入するように促します。

ユーザーが選択した値は、タスクが実行されたときに`COMMAND`型のタスクで環境変数として利用可能になります。

![タスク引数](../images/custom-task-arguments.png)


### システム全体のタスク

プラットフォームの管理者は、システム全体のタスクを登録することができます。これらのタスクはすべての環境で表示され、ユーザーがそれらを呼び出す権限によって制限されます。

システム全体のタスクを作成する方法は、他のタスクタイプとほぼ同じですが、2つの例外があります。

まず、`addAdvancedTaskDefinition`ミューテーションの中で`systemWide: true`フィールドを設定します。

次に、`groupName`、`project`、または`environment`を指定してい*ない*ことを確認します - これらのフィールドは特定のコンテキストをターゲットにするために使用されるため、これらを指定すると目的を逸脱することになります。


### 確認

`confirmationText`フィールドにテキストがあると、ユーザーがタスクを実行できるようになる前に、UIに確認モーダルとともに表示されます。 ![タスク確認](../images/custom-task-confirm.png)

## タスクの呼び出し

タスクが定義されていると、タスクはLagoon UIのタスクドロップダウンに表示されるはずです。

また、`invokeTask` ミューテーションを使用してGraphQL apiからも呼び出すことができます。

```graphql title="タスクの呼び出し"
mutation invokeTask {
  invokeRegisteredTask(advancedTaskDefinition: int, environment: int) {
    status
  }
}
```

`invokeTask`は常に_特定の環境_でタスクを呼び出すことに注意してください。

## 例

では、`yarn audit`の例を設定してみましょう。

```graphql title="タスク定義ミューテーション"
mutation runYarnAudit {
 addAdvancedTaskDefinition(input:{
    name:"Run yarn audit",
    project: 42,
    type:COMMAND,
    permission:DEVELOPER,
    description: "Runs a 'yarn audit'",
    service:"node",
    command: "yarn audit"})
    {
        id
    }
}
```

これにより、私たちのプロジェクト(42)のタスクが定義されます。これを実行すると、タスク定義のIDが返されます(たとえば、`9`とします)

このタスクは、`DEVELOPER`または`MAINTAINER`の役割を持つ誰でもUIから実行できるようになります。

![タスクリスト](../images/task-yarn-audit.png)
