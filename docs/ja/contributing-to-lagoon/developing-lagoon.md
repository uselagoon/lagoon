# Lagoonの開発

Lagoonのローカル開発は、現在、ローカルのKubernetesクラスターまたはDocker Compose(フォールバックとして)を経由して行うことができます。

!!! Note "注意:"
    フルのLagoonスタックは、現在ARMベースのアーキテクチャ(M1/M2 Apple Siliconベースのマシンなど)と互換性のない上流プロジェクトに依存しています。このため、これらのアーキテクチャ上で`lagoon-core`または`lagoon-remote`をローカルで実行または開発することは現在サポートされていません。詳細はhttps://github.com/uselagoon/lagoon/issues/3189 をご覧ください。

## Docker

Dockerは、ローカルでLagoonをビルドおよび実行するためにインストールする必要があります。

### DockerとDocker Composeのインストール

Dockerのインストール方法については、[公式ドキュメント](https://docs.docker.com/engine/installation/)をご覧ください。

Docker Composeは、Docker for Macのインストールに含まれています。Linuxのインストールについては[こちらの手順](https://docs.docker.com/compose/install/)を参照してください。

### Dockerの設定

Dockerのセキュアでないレジストリを更新する必要があります。[その方法についてはこちらを読んで](https://docs.docker.com/registry/insecure/)ください。再設定を避けるため、全てのローカルIPv4プライベートアドレススペースを追加することをおすすめします。 KubernetesとDocker Compose。たとえば、`"insecure-registries" : ["172.16.0.0/12","192.168.0.0/16"],`

### 十分なDockerリソースの割り当て

ローカルマシン上でLagoon、Kubernetes、またはDockerクラスタを実行すると、多くのリソースを消費します。Dockerホストには最低でも8つのCPUコアと12GBのRAMを割り当てることをお勧めします。

## ローカルでLagoonをビルドする

!!! Warning "警告"
    Lagoonをこの方法でビルドを考えるのは、それに機能や機能を開発したい、または内部プロセスをデバッグしたい場合だけです。また、ビルドせずにLagoonをインストールする方法(つまり、公開されたリリースを使用する方法)の指示も提供します。

私たちは、必要なDockerイメージをビルドし、Kubernetesを設定し、テストを実行するために`make`([Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile)を参照)を使用しています。

私たちは、ほとんどのローカル開発シナリオをカバーするために、[Makefile](https://github.com/uselagoon/lagoon/blob/main/Makefile)にいくつかのルーチンを提供しました。ここでは、完全なプロセスを実行します。

### イメージのビルド

1. ここでの`-j8`は、**make**にビルドを速めるために並列で8つのタスクを実行するように指示します。必要に応じて調整してください。
2. デフォルトで`SCAN_IMAGES=false`を設定して、ビルドしたイメージをスキャンしないようにしています。 脆弱性。これをtrueに設定すると、スキャン結果を含む`scan.txt`ファイルがプロジェクトルートに作成されます。

```bash title="イメージのビルド"
make -j8 build
```

1. MakefileのデフォルトでLagoonのテストルーティンを開始します(すべてのテスト)。

```bash title="テスト開始"
make kind/test
```

!!! Warning "警告"
    デフォルトで実行するために設定されたテストが多数あります - 機能を確保するために必要最低限のローカルでのテストのみを考慮してください。これは、Makefileの`TESTS`変数からテストを指定したり削除したりすることで行うことができます。

このプロセスでは次のことが行われます:

1. インストールされていない場合は、ローカル開発ツールの正しいバージョンをダウンロードします - `kind`、`kubectl`、`helm`、`jq`。
2. Lagoonが機能するために必要なHelmリポジトリを更新します。
3. 前のステップで正しいイメージがすべてビルドされていることを確認します。
4. ローカルの[KinD](https://kind.sigs.k8s.io/)クラスターを作成します。これは、ローカルのDockerコンテナに完全に稼働するKubernetesクラスタを提供します。このクラスタは、ビルドしたLagoonイメージをプッシュするために提供されたイメージレジストリと通信するように設定されています。また、ローカル開発のためにホストファイルシステムへのアクセスも許可されています。
5. Lagoonを[ https://github.com/uselagoon/lagoon-charts](https://github.com/uselagoon/lagoon-charts) \(必要に応じてMakefileの`CHARTS_TREEISH`変数を使用してブランチを制御してください\).
6. Harbor ImageレジストリをKinDクラスタにインストールし、そのイングレスとアクセスを適切に設定します。
7. DockerはビルドしたLagoonのイメージをHarborイメージレジストリにプッシュします。
8. 次に、[lagoon-chartsのMakefile](https://github.com/uselagoon/lagoon-charts/blob/main/Makefile)を使用して、残りの設定手順を進行します。
9. 適切なイングレスコントローラーがインストールされます - [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)を使用します。
10. 特定のボリューム要求を処理するローカルNFSサーバープロビジョナーがインストールされます - Read-Write-Many操作(RWX)を処理するものを使用します。
11. その後、Lagoon Coreがインストールされ、クラスターローカルイメージレジストリにプッシュされたローカルでビルドされたイメージを使用し、デフォルトの設定を使用します。これにより、ローカルテストに必要とされない一部のサービスが除外される場合があります。インストールは、APIとKeycloakがオンラインになるのを待ちます。
12. DBaaSプロバイダーがインストールされます - MariaDB、PostgreSQL、MongoDB。このステップでは、スタンドアロンのデータベースがプロビジョニングされ、 ローカルで実行中のプロジェクトと、クラウドプロバイダー(例えば、Cloud SQL、RDS、Azure Databaseなど)経由で利用可能なマネージドサービスをエミュレートします。
13. 次にLagoon Remoteがインストールされ、Lagoon Core、データベース、ローカルストレージと通信するように設定されます。インストールはこれが完了するのを待ってから続行します。
14. テストをプロビジョニングするために、Lagoon Testチャートがインストールされます。これにより、テストリポジトリをホストするローカルのGitサーバーがプロビジョニングされ、デフォルトのテストユーザー、アカウント、設定でLagoon APIデータベースが事前に設定されます。それから、テストを開始する前に準備チェックを行います。
15. Lagoonは、MakefileのTESTS変数で指定されたすべてのテストを実行します。各テストは自身のプロジェクトと環境を作成し、テストを実行した後に環境とプロジェクトを削除します。テストの実行結果は`lagoon-test-suite-*`ポッドのコンソールログに出力され、コンテナごとに1つのテストを参照することができます。

理想的には、すべてのテストが通過し、すべて終了します！

### テストの進行状況とローカルクラスターの表示

テストルーチンはローカルのKubeconfigファイル(プロジェクトのルートに`kubeconfig.kind.lagoon`という名前で)を作成し、Kubernetesのダッシュボード、ビューワ、CLIとともに使用することができます。 ローカルクラスタにアクセスするためのツールです。私たちは、[Lens](https://k8slens.dev/)、[Octant](https://octant.dev/)、[kubectl](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)、[Portainer](https://www.portainer.io/)といったツールをワークフローに使用しています。Lagoon Core、Remote、Testsはすべて`Lagoon`ネームスペースでビルドされ、各環境は自身のネームスペースを作成して実行するため、確認する際には正しいコンテキストを使用することを確認してください。

ローカルクラスタとkubectlを使用するには、正しいKubeconfigを使用する必要があります。これは、すべてのコマンドで行うことも、好みのツールに追加することもできます:

```bash title="kubeconfig.kind.lagoon"
KUBECONFIG=./kubeconfig.kind.lagoon kubectl get pods -n lagoon
```

ローカルのLagoonをビルドするために使用されるHelmチャートは、ローカルのフォルダにクローンされ、`lagoon-charts.kind.lagoon`にシンボリックリンクされています。ここで設定を確認することができます。後でこのドキュメンテーションで簡単な変更の方法を説明します。

### ローカルLagoonクラスタと対話する

Makefileには、インストールされたLagoonとの対話を簡単にするいくつかのルーチンが含まれています:

```bash title="Create local ports"
make kind/port-forwards
```

これにより、UIを公開するためのローカルポートが作成されます。 6060\)、API \(7070\)、そして Keycloak \(8080\)です。これは `stdout`にログを出力するため、別のターミナル/ウィンドウで実行すべきでしょう。

```bash title="管理者の資格情報を取得する"
make kind/get-admin-creds
```

これにより、Lagoonとやり取りするための必要な資格情報が取得されます。

* JWTは、ローカルのGraphQLクライアントでbearerトークンとして使用するための管理者スコープのトークンです。[詳細はGraphQLのドキュメンテーションをご覧ください](../interacting/graphql.md)。
* Keycloakの"admin"ユーザー用のトークンがあり、すべてのユーザー、グループ、ロールなどにアクセスできます。
* Lagoonの"lagoonadmin"ユーザー用のトークンもあり、デフォルトのグループ、権限などを割り当てることができます。

```bash title="イメージの再プッシュ"
make kind/dev
```

これにより、`KIND_SERVICES`にリストされたイメージが正しいタグで再プッシュされ、lagoon-coreチャートが再デプロイされます。これはLagoonのサービスに対する小さな変更をテストするのに便利ですが、"ライブ"開発はサポートされていません。まずこれらのイメージをローカルで再構築する必要があります。例:`rm build/api && make build/api`.

```bash title="typescriptのサービスをビルドする"
make kind/local-dev-patch
```

これにより、ローカルにインストールされたNode.jsを使用してtypescriptのサービスがビルドされます(これは &gt;16.0\)。その後、次の操作を行います:

* Lagoonサービスからの`dist`フォルダをKubernetesの正しいlagoon-coreポッドにマウントします
* コードの変更を監視する`nodemon`が動作しているサービスと共にlagoon-coreチャートを再デプロイします
* これにより、Lagoon でのライブ開発が容易になります。
* Kubernetesのポッドに変更が反映されるためには、時折再デプロイが必要なことに注意してください。異なるブランチを`git clean -dfx`で再ビルドする場合は、そのサービスからのビルド成果物をクリーンにしてください。なお、distフォルダはGitによって無視されます。

```bash title="ロギングを開始"
make kind/local-dev-logging
```

これにより、ローカルのDockerに独立したOpenDistro for Elasticsearchクラスタが作成され、Lagoonがすべてのログ(Lagoonおよびプロジェクト)をそれに送信するように設定します。設定は[lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging)に記載されています。

```bash title="テストを再実行"
make kind/retest
# OR
make kind/retest TESTS='[features-kubernetes]'
```

これにより、既存のクラスタに対する一連のテスト(`TESTS`変数で定義)が再実行されます。テスト用のイメージ(tests、local-git、data-watcher-pusher)が再プッシュされます。テストを指定することもできます。 TESTS変数をインラインで渡して実行します。

テスト設定を更新する場合、テストイメージを再ビルドしてプッシュする必要があります。例えば、`rm build/tests && make build/tests && make kind/push-images IMAGES='tests' && make kind/retest TESTS='[api]'`

```bash title="Push all images"
make kind/push-images
# OR
make kind/push-images IMAGES='tests local-git'
```

これにより、すべてのイメージがイメージレジストリにプッシュされます。`IMAGES`を指定すると、特定のイメージにタグを付けてプッシュします。

```bash title="Remove cluster"
make kind/clean
```

これにより、ローカルのDockerからKinD Lagoonクラスタが削除されます。

### Ansible

Lagoonテストでは、Ansibleを用いてテストスイートを実行します。特定の機能のテスト範囲は、それぞれのルーチンに分割されています。ローカルで開発作業を行っている場合は、実行するテストを選択し、Makefile内の`$TESTS`変数を更新して、同時に実行されるテストを減らします。

これらのテストの設定は3つのサービスで保持されています:

* `tests`はAnsibleテストサービスそのものです。ローカルのテストルーチンでは、各個々のテストをテストスイートのポッド内の別々のコンテナとして実行します。これらは以下にリストされています。
* `local-git`はクラスタ内でホストされるGitサーバで、それが保持しています テストのソースファイル。Ansibleはテストの間にこのリポジトリにプルとプッシュを行います。
* `api-data-watcher-pusher`は、必要なKubernetes設定、テストユーザーアカウントとSSHキー、必要なグループと通知をローカルLagoonに事前に配置するためのGraphQL変異のセットです。 **これは実行ごとにローカルプロジェクトと環境を消去することに注意してください。**

Kubernetesに関連する個々のルーチンは次のとおりです:

* `active-standby-kubernetes`はKubernetesでのアクティブ/スタンバイを確認するテストを実行します。
* `api`はAPI - ブランチ/PRデプロイメント、昇進のテストを実行します。
* `bitbucket`、`gitlab`、`github`は特定のSCMプロバイダーのテストを実行します。
* `drupal-php74`は単一ポッドのMariaDB、MariaDB DBaaS、およびDrupal 8/9プロジェクト用のDrush特化テストを実行します(`drupal-php73`はDrushテストを行いません)。
* `drupal-postgres`は、Drupal 8プロジェクト用の単一ポッドのPostgreSQLとPostgreSQL DBaaSテストを実行します。
* `elasticsearch`はElasticsearch単一ポッドへのシンプルなNGINXプロキシを実行します。
* `features-variables`はLagoon内の変数を利用するテストを実行します。
* `features-kubernetes`はKubernetesに特化した標準的なLagoonテストの範囲を実行します。
* `features-kubernetes-2`はより高度なkubを実行します * エンダーン特有のテスト - 複数のプロジェクトとサブフォルダ設定をカバー。
* `nginx`、`node`、`python`は、それぞれのプロジェクトタイプに対して基本テストを実行します。
* `node-mongodb`は、単一ポッドのMongoDBテストとNode.jsアプリケーションに対するMongoDB DBaaSテストを実行します。

## ローカル開発

ほとんどのサービスは[Node.js](https://nodejs.org/en/docs/)で書かれています。これらのサービスの多くが同様のNode.jsコードとNode.jsパッケージを共有しているため、[Yarn](https://yarnpkg.com/en/docs)という機能を使用しています。これは[Yarn workspaces](https://yarnpkg.com/en/docs/workspaces)と呼ばれます。Yarn workspacesは、ワークスペースを定義するプロジェクトのルートディレクトリに`package.json`が必要です。

サービスの開発は、Docker内で直接行うことができます。それぞれのサービスのコンテナは、ソースコードが実行中のコンテナにマウントされるように設定されています([`docker-compose.yml`を参照](../concepts-basics/docker-compose-yml.md))。Node.js自体が`nodemon`を介してコードを監視し、変更があるとNode.jsプロセスを自動的に再起動します。

### lagoon-commons

サービスは多くのNode.jsパッケージだけでなく、実際のカスタムコードも共有しています。このコードは`node-packages/lagoon-commons`内にあり、自動的にシンボリックリンクされます。 Yarnワークスペースによって管理されています。さらに、サービスの[`nodemon`](https://www.npmjs.com/package/nodemon)は、`node-packages`の変更をチェックし、ノードプロセスを自動的に再起動するように設定されています。

## トラブルシューティング

### Node.jsベースのサービスのDockerイメージをビルドできない

以下のようにイメージを再ビルドしてください:

```bash title="イメージの再構築"
    make clean
    make build
```

### Node.jsベースのイメージをビルド/実行しようとすると、`node_modules`の内容が不足しているというエラーが出る

一部のサービスが`yarn`ワークスペースによって管理されている共通の依存関係を持っているため、Lagoonのルートディレクトリで`yarn`を実行してください。

### `sslip.io`ドメインの解決でエラーが出る

```text title="エラー"
Error response from daemon: Get https://registry.172.18.0.2.sslip.io:32080/v2/: dial tcp: lookup registry.172.18.0.2.sslip.io: no such host
```

これは、ローカルのリゾルバが結果からプライベートIPをフィルタリングする場合に発生することがあります。これを回避するために、`/etc/resolv.conf`を編集して、結果をフィルタリングしない公開リゾルバを使用するように、上部に`nameserver 8.8.8.8`のような行を追加できます。

## 例示的なワークフロー

ここでは、開発のシナリオと物事を進めるための有用なワークフローをいくつか紹介します。

### テストの追加 1. 上記の最初の手順を繰り返します。
2. `tests/tests/features-variables.yaml`を編集し、テストケースを追加します。
3. `tests`イメージを再構築します。

```bash title="テストの構築"
rm build/tests
make -j8 build/tests
```

1. 新しい`tests`イメージをクラスタレジストリにプッシュします。

```bash title="テストイメージをプッシュ"
make kind/push-images IMAGES=tests
```

1. テストを再実行します。

```bash title="テストを再実行"
make kind/retest TESTS='[features-variables]'
```
