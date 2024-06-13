# ビルドとデプロイプロセス

この文書では、Lagoonのビルドとデプロイメント中に実際に何が起こるかを説明します。実際のプロセスから大幅に単純化されていますが、Lagoonが新しいコードをデプロイするたびに何が行われているかを理解するのに役立ちます。

以下のビデオを見て、デプロイメントプロセスの詳細を確認してください。

<iframe width="560" height="315" src="https://www.youtube.com/embed/XiaH7gqUXWc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 1. 環境のためのOpenShiftプロジェクト/Kubernetesネームスペースの設定

まず、Lagoonは指定された環境のOpenShiftプロジェクト/Kubernetesネームスペースが存在して正しく設定されているかどうかを確認します。必要なサービスアカウントがあることを確認し、シークレットを作成し、環境変数を`lagoon-env`というConfigMapに設定します。これは、環境のタイプや名前、Lagoonプロジェクトの名前などの情報で満たされます。

## 2. Gitのチェックアウトとマージ

次に、LagoonはGitからコードをチェックアウトします。これは、`.lagoon.yml`や`docker-compose.yml`を読み取るために必要です。 そして、`.env`ファイルだけでなく、Dockerイメージをビルドします。

ブランチ/PRがLagoonで設定されたブランチregexと一致する場合にのみ、Lagoonはこれらのアクションを処理します。デプロイがどのようにトリガーされたかにより、異なることが起こります：

### **ブランチWebhook プッシュ**

デプロイがGit webhook経由で自動的にトリガーされ、単一のブランチ向けである場合、Lagoonはwebhookペイロードに含まれるGit SHAをチェックアウトします。これにより、プッシュされた各Git SHAごとにデプロイがトリガーされます。

### **ブランチ REST トリガー**

REST API経由（UIまたはGraphQL経由）で手動でブランチデプロイをトリガーし、POSTペイロードで`SHA`を定義しない場合、Lagoonはそのブランチの最新のコミットを単にチェックアウトし、それをデプロイします。

### **プルリクエスト**

デプロイがプルリクエスト（PR）デプロイである場合、LagoonはプルリクエストのベースとHEADブランチおよびSHAをロードし、次のことを行います：

* PRが指しているブランチ（ベースブランチ）をチェックアウトします。
* PRが起源となるブランチ（`HEAD`ブランチ）をベースブランチの上にマージします。
* **より具体的には：**
  * Lagoonはwebhookで送信された特定のSHAをチェックアウトし、マージします。それらのSHAは、あるいは_ないかもしれません_ ブランチのヘッドを指してください。たとえば、GitHubのプルリクエストに新たにプッシュをすると、基本ブランチのSHAが現在の基本ブランチのHEADを指さないことがあります。

マージが失敗した場合、Lagoonも停止し、そのことをお知らせします。

## 3. イメージのビルド

`docker-compose.yml`で定義された各サービスについて、Lagoonはイメージがビルドする必要があるかどうかを確認します。ビルドする必要がある場合、この時点でそれが行われます。ビルドの順序は、`docker-compose.yml`での設定順に基づいています。いくつかのビルド引数が注入されます：

* `LAGOON_GIT_SHA`
* `LAGOON_GIT_BRANCH`
* `LAGOON_PROJECT`
* `LAGOON_BUILD_TYPE` \( `pullrequest`、`branch`、または `promote` のいずれか\)
* `LAGOON_SSH_PRIVATE_KEY` - ソースリポジトリをクローンするために使用されるSSHの秘密鍵です。ビルド引数を実際の鍵に変換するには、`RUN /lagoon/entrypoints/05-ssh-key.sh`を使用します。この鍵は`/home/.ssh/key`にあり、SSHとGitが自動的に使用します。安全のため、`RUN rm /home/.ssh/key`を使用して鍵を再度削除します。
* `LAGOON_GIT_SOURCE_REPOSITORY` - ソースリポジトリの完全なGit URL。

また、これがプルリクエストのビルドである場合：

* `LAGOON_PR_HEAD_BRANCH`
* `LAGOON_PR_HEAD_SHA`
* `LAGOON_PR_BASE_BRANCH`
* `LAGOON_PR_BASE_SHA`
* `LAGOON_PR_TITLE`

また、すでに構築された各イメージの名前も注入されます。あなたの`docker-compose.yml`が最初に`cli`イメージを構築し、次に`nginx`イメージを構築するように設定されている場合、`nginx`イメージの名前は`NGINX_IMAGE`として注入されます。

## 4. KubernetesまたはOpenShiftのサービスとルートを設定する

次に、Lagoonは、サービスタイプから定義されるすべてのサービスとルート、および`.lagoon.yml`で定義した可能な追加のカスタムルートをKubernetesまたはOpenShiftに設定します。

このステップでは、`LAGOON_ROUTES`で定義されたすべてのルートをカンマ区切りのURLとして公開します。また、以下の順序で1つのルートを"main"ルートとして定義します：

1. カスタムルートが定義されている場合：`.lagoon.yml`で最初に定義されたカスタムルート。
2. `docker-compose.yml`で定義されたサービスから自動生成された最初のルート。
3. なし。

"main"ルートは`LAGOON_ROUTE`環境変数を介して注入されます。

## 5. イメージのプッシュとタグ付け

これで、以前に構築したDockerイメージを内部のDockerイメージレジストリにプッシュする時が来ました。

`docker-compose.yml`でDockerfileを指定せず、イメージのみを指定したサービスの場合、それらもタグ付けされます。 そして、これにより内部のDockerイメージレジストリがイメージを認識し、コンテナで使用できるようになります。

## 6. 永続的なストレージ

Lagoonは、永続的なストレージ（PVC）を必要とし、リクエストしたそれぞれのサービスに対して作成します。

## 7. Cronジョブ

Cronジョブをリクエストするサービス（MariaDBなど）、および`.lagoon.yml`で定義されたカスタムCronジョブそれぞれについて、Lagoonは後で[デプロイメント](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)に注入されるCronジョブ環境変数を生成します。

## 8. 定義済みのプレロールアウトタスクの実行

これでLagoonは`.lagoon.yml`ファイルをチェックし、`pre-rollout`で定義されたタスクを探し、定義されたサービスで1つずつ実行します。これらのタスクは現在実行中のポッド上で実行されるため（最新のコミットに存在する機能やスクリプトを利用できません）、初回のデプロイメントでは実行されません。

これらのいずれかが失敗すると、Lagoonはすぐに停止し、あなたに通知し、ロールアウトは進行しなくなります。

## 9. DeploymentConfigs、Statefulsets、Daemonsets

これがおそらく最も重要なステップです。定義されたサービスタイプに基づいて、Lagoonは[ [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)、[Statefulset](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) または [Daemonsets](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) をサービス用に使用します。 \(DeploymentはOpenShiftの [DeploymentConfigs](https://docs.openshift.com/container-platform/latest/applications/deployments/what-deployments-are.html) と同等です\)

これには、以前に収集した情報、cronジョブ、永続ストレージの位置、プッシュされたイメージなど全てが含まれます。

これらのオブジェクトの作成は、環境変数が変更されたり、イメージが変更されたりした場合など、必要に応じてKubernetesやOpenShiftがポッドの新しいデプロイメントを自動的にトリガーすることも引き起こします。しかし、変更がない場合はデプロイメントは行われません！これは、アプリケーションのPHPコードのみを更新した場合、Varnish、Solr、MariaDB、Redisなどの定義されているがあなたのコードを含まない他のサービスはデプロイされないということを意味します。これにより、全てが非常に高速になります。

## 10. すべてのロールアウトが完了するのを待つ

今、Lagoonは待ちます！それは、ちょうどトリガーされたデプロイメントの全部が 新しいポッドが完了し、その健康チェックが成功すること。

デプロイメントや健康チェックのいずれかが失敗した場合、デプロイメントはここで停止し、デプロイメントが失敗したことを[定義済みの通知システム](../interacting/graphql-queries.md#adding-notifications-to-the-project)（例えばSlack）を通じて通知します。

## 11. 定義されたポストロールアウトタスクの実行

次に、Lagoonは`.lagoon.yml`ファイルをチェックして`post-rollout`で定義されたタスクを探し、定義されたサービスでそれらを一つずつ実行します。

これらのいずれかが失敗した場合、Lagoonは直ちに停止し、あなたに通知します。

## 12. 成功

全てが順調に進み、何もエラーが発生しなかった場合、Lagoonはこのビルドを成功とマークし、定義された通知を介してあなたに通知します。✅