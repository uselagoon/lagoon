# 環境変数

APIトークンやアプリケーションの資格情報を環境変数に保存することは一般的です。

ベストプラクティスに従って、これらの資格情報は環境ごとに異なります。私たちは、各環境が環境変数または環境ファイルで定義された別の環境変数セットを使用できるようにします。

Dockerfileまたはランタイム時（API環境変数経由）のいずれかで定義されている環境変数があるため、環境変数の階層があります。低い数字で定義された環境変数が強いです。

1. 環境変数（Lagoon API経由で定義） - 環境固有。
2. 環境変数（Lagoon API経由で定義） - プロジェクト全体。
3. Dockerfileで定義された環境変数（`ENV`コマンド）。
4. `.lagoon.env.$LAGOON_GIT_BRANCH`または`.lagoon.env.$LAGOON_GIT_SAFE_BRANCH`で定義された環境変数（ファイルが存在し、`$LAGOON_GIT_BRANCH` `$LAGOON_GIT_SAFE_BRANCH`がこのDockerイメージがビルドされたブランチの名前と安全な名前である場合）、これを特定のブランチのみの変数の上書きに使用します。
5. `.lagoon.env`で定義された環境変数（存在する場合）、これを全ての変数の上書きに使用します。 ブランチ。
6. `.env`で定義された環境変数。
7. `.env.defaults`で定義された環境変数。

`.lagoon.env.$LAGOON_GIT_BRANCH`、`.lagoon.env.$LAGOON_GIT_SAFE_BRANCH`、`.env`、そして `.env.defaults`は、全て、各コンテナ自体によってエントリーポイントスクリプトの一部として実行される際にソース化されます。それらはLagoonではなく、コンテナの `ENTRYPOINT` スクリプトによって読み込まれ、コンテナの作業ディレクトリでそれらを探します。環境変数が期待通りに表示されない場合は、コンテナに他の場所を指す `WORKDIR` 設定があるかどうかを確認してください。

## 環境変数 - Lagoon API { #environment-variables-lagoon-api }

Gitリポジトリに保存したくない変数（シークレットやAPIキーなど）については、Lagoon APIの環境変数システムを使用することをお勧めします。これらの変数は、誰かがローカルの開発環境やインターネット上に持っていると、危険にさらされる可能性があります。

Lagoon APIでは、プロジェクト全体または環境固有の変数を定義することができます。さらに、スコープ限定のビルド時またはランタイムに対して定義することもできます。これらはすべてLagoon GraphQL APIを通じて作成されます。GraphQL APIの使用方法については、[GraphQL API](../interacting/graphql.md)のドキュメンテーションで詳しく説明しています。

### ランタイム環境変数 - LagoonAPI { #runtime-environment-variables-lagoon-api }

ランタイム環境変数は自動的にすべてのコンテナで利用可能になりますが、環境が再デプロイされた後にのみ追加または更新されます。

これは、ID `463`のプロジェクト用にプロジェクト全体のランタイム変数（すべての環境で利用可能）を定義します：

```graphql title="ランタイム変数の追加"
mutation addRuntimeEnv {
  addEnvVariable(
    input:{
      type:PROJECT,
      typeId:463,
      scope:RUNTIME,
      name:"MYVARIABLENAME",
      value:"MyVariableValue"
    }
  ) {
    id
  }
}
```

これは、環境ID `546`特有のランタイム変数（特定の環境のみで利用可能）を定義します：

```graphql title="環境IDの定義"
mutation addRuntimeEnv {
  addEnvVariable(
    input:{
      type:ENVIRONMENT,
      typeId:546,
      scope:RUNTIME,
      name:"MYVARIABLENAME",
      value:"MyVariableValue"
    }
  ) {
    id
  }
}
```

### ビルド時の環境変数 LagoonAPI { #build-time-environment-variables-lagoon-api }

ビルド時の環境変数はビルド中にのみ利用可能であり、Dockerfilesで以下のように使用する必要があります：

```graphql title="ビルド時の環境変数の使用"
ARG MYVARIABLENAME
```

通常、`ARG`はその後に行くでしょう。 FROM. [ARGとFROMについてのdockerドキュメントを読む](https://docs.docker.com/engine/reference/builder/#understand-how-arg-and-from-interact)。

これは、ID `463`のプロジェクト全体のビルド時変数（すべての環境で利用可能）を定義します。

```graphql title="プロジェクト全体のビルド時変数を定義する"
mutation addBuildtimeEnv {
  addEnvVariable(
    input:{
      type:PROJECT,
      typeId:463,
      scope:BUILD,
      name:"MYVARIABLENAME",
      value:"MyVariableValue"}
  ) {
    id
  }
}
```

これは、環境ID `546`特有のビルド時変数を定義します（その特定の環境内だけで利用可能）。

```graphql title="環境IDを定義する"
mutation addBuildtimeEnv {
  addEnvVariable(input:{type:ENVIRONMENT, typeId:546, scope:BUILD, name:"MYVARIABLENAME", value:"MyVariableValue"}) {
    id
  }
}
```

コンテナレジストリの環境変数は、ビルド中にのみ利用可能で、プライベートレジストリにログインしようとするときに使用されます。これらは、[Specials » `container-registries`](../concepts-basics/lagoon-yml.md#specials)で定義されたユーザーのパスワードを保存するために使用されます。これらはプロジェクトレベルまたは環境レベルで適用することができます。

これは、プロジェクト全体を定義します プロジェクトID `463`のためのコンテナレジストリ変数（すべての環境で利用可能）：

```graphql title="プロジェクト全体のコンテナレジストリ変数を定義する"
mutation addContainerRegistryEnv {
  addEnvVariable(
    input:{
      type:PROJECT,
      typeId:463,
      scope:CONTAINER_REGISTRY,
      name:"MY_OWN_REGISTRY_PASSWORD",
      value:"MySecretPassword"})
  ) {
    id
  }
}
```

これは、環境ID `546`特有のコンテナレジストリ変数を定義します（その特定の環境内でのみ利用可能）：

```graphql title="環境IDを定義する"
mutation addContainerRegistryEnv {
  addEnvVariable(
    input:{
      type:ENVIRONMENT,
      typeId:546,
      scope:CONTAINER_REGISTRY,
      name:"MY_OWN_REGISTRY_PASSWORD",
      value:"MySecretPassword"}
  ) {
    id
  }
}
```

### グローバル環境変数 - Lagoon API { #global-environment-variables-lagoon-api }

グローバル環境変数は、ビルドによって消費されるためのビルド時環境変数として、また実行中のコンテナ内で利用可能なランタイム変数として利用できます。

## Gitリポジトリに直接存在する環境ファイル { #environment-files-existing-directly-in-the-git-repo }

Gitリポジトリ内に安全に保存できる環境変数がある場合、追加することをお勧めします Gitリポジトリの環境ファイルに直接入力します。これらの変数はローカル開発環境でも利用可能であり、より移植性が高いです。

環境ファイルの構文は次のとおりです：

```bash title="myenvironment.env"
MYVARIABLENAME="MyVariableValue"
MVARIABLENUMBER=4242
DB_USER=$DB_USERNAME # DB_USERNAMEの値でDB_USERを再定義します。例えば、アプリケーションがLagoon提供の変数に対して別の変数名を期待している場合などです。
```

### `.lagoon.env.$BRANCHNAME` { #lagoonenvbranchname }

環境ごとに異なる環境変数を定義したい場合は、`.lagoon.env.$BRANCHNAME`を作成できます。例えば、メインブランチの場合は`.lagoon.env.main`です。これにより、環境間での環境変数の区別が容易になります。

### `.env` and `.env.defaults` { #env-and-envdefaults }

`.env`と`.env.defaults`は、他に定義されていない場合の環境変数のデフォルト値として機能します。例えば、プルリクエスト環境用のデフォルト環境変数として（[Workflows](workflows.md#pull-requests)参照）。

## 特別な環境変数 { #special-environment-variables }

### `PHP_ERROR_REPORTING` { #php_error_reporting }

この変数が設定されている場合、PHPが使用する[ログ](../logging/logging.md)レベルを定義します。指定されていない場合は、それが これはプロダクション環境か開発環境かによって動的に設定されます。

プロダクション環境では、この値はデフォルトで`E_ALL & ~E_DEPRECATED & ~E_STRICT & ~E_NOTICE`になります。

開発環境では、この値はデフォルトで`E_ALL & ~E_DEPRECATED & ~E_STRICT`になります。

### カスタムバックアップ設定 { #custom-backup-settings }

Lagoonは、次の4つの変数すべてが`BUILD`タイプの変数として設定されている場合、任意のプロジェクトのカスタムバックアップ場所と認証情報をサポートします。環境変数はプロジェクトレベルで（環境ごとではなく）設定する必要があり、それらを設定した後にLagoonのデプロイメントが必要です（すべての環境について）。

これらの変数のいずれかを使用すると、Lagoonが作成および管理するすべての環境とデータベースのバックアップがこれらの認証情報を使用して格納されることを意味します。つまり、これらの認証情報の中断がバックアップの失敗またはアクセス不能を引き起こす可能性があります。

Translation request timed out.

### カスタム復元場所 { #custom-restore-location }

`BUILD`タイプの環境変数として以下の全4つの変数が設定されている場合、任意のプロジェクトに対してカスタムリストアロケーションと資格情報を設定できます。環境変数はプロジェクトレベルで設定する必要があり（環境ごとではなく）、それらを設定した後、Lagoonのデプロイが必要です（各環境について）。

これらの変数を使用すると、Lagoonによって復元されたすべての環境とデータベースのスナップショットがこれらの資格情報を使用して保存されることに注意してください。これは、これらの資格情報へのアクセスが中断されると、復元されたファイルの失敗またはアクセス不能につながる可能性があることを意味します。

Translation request timed out.
```json title="aws_iam_restore_policy.json"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetBucketLocation",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::example-restore-bucket"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:GetBucketLocation",
        "s3:PutObjectAcl"
      ],
      "Resource": [
         "arn:aws:s3:::example-restore-bucket/*"
      ]
    }
  ]
}
```

増強されたセキュリティと削減されたストレージコストのために、[設定されたライフタイム後に復元されたバックアップを削除する](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)（例えば、7日間）を選択することができます。Lagoonはこのシナリオをうまく処理し、必要に応じて復元されたスナップショットを再作成します。
