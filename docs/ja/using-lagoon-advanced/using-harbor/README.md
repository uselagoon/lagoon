# ハーバー

[Harbor](https://goharbor.io/)は、Kubernetesインフラにデプロイする際のLagoonのデフォルトのパッケージリポジトリとして使用されます。HarborはDockerレジストリと、[Trivy](https://github.com/aquasecurity/trivy)によって提供されるコンテナセキュリティスキャニングソリューションを提供します。

!!! Note "注意:"
    Lagoonをローカルで実行している場合、Harborの設定はすべて自動的に処理されます。
<!-- markdown-link-check-disable-next-line -->
もしLagoonをローカルで実行している場合は、そのUIに[localhost:8084](https://localhost:8084/)からアクセスできます。ユーザ名は `admin`、パスワードは `admin`です。

!!! Note "注意:"
    サイトをプロバイダー(amazee.ioなど)でホストしている場合、それらのプロバイダーは顧客がHarbor UIにアクセスすることを許可しない場合があります。

ログインすると、最初の画面にはユーザーがアクセスできるすべてのリポジトリのリストが表示されます。Harbor内の各「リポジトリ」はLagoonのプロジェクトに対応しています。

![Harborプロジェクトの概要](../../images/projects_overview.png)

各Harborリポジトリ内には、1つのLagoonプロジェクトが持つすべての環境のコンテナイメージリストが表示されます。

![Harborリポジトリの概要](../../images/repositories_overview.png)

ここから、個々のコンテナを深く掘り下げてセキュリティスキャン結果の概要を含む詳細を見ることができます。

![Harbor Container Overview](../../images/container_overview.png)
