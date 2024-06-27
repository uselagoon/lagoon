# Lagoon CLIのインストール

1. あなたのオペレーティングシステムに対応するインストール方法については、[https://github.com/uselagoon/lagoon-cli#install](https://github.com/uselagoon/lagoon-cli#install)をご覧ください。macOSとLinuxでは、Homebrewを使用することができます。
  1. `brew tap uselagoon/lagoon-cli`
  2. `brew install lagoon`
2. CLIはLagoonとどのように通信するかを知る必要があるため、以下のコマンドを実行します:

    ```bash title="Lagoon config"
        lagoon config add \
            --graphql https://YOUR-API-URL/graphql \
            --ui https://YOUR-UI-URL \
            --hostname YOUR.SSH.IP \
            --lagoon YOUR-LAGOON-NAME \
            --port 22
    ```

3. SSHキーで認証してLagoonにアクセスします。

   1. Lagoon UI(URLは`values.yml`に記載されています)に移動し、**設定**に進みます。
   2. 公開SSHキーを追加します。
   3. amazee.ioのデフォルトを使用しようとするのを防ぐため、デフォルトのLagoonを_あなたの_ Lagoonに設定する必要があります:

    ```bash title="Lagoon config"
        lagoon config default --lagoon <YOUR-LAGOON-NAME>
    ```

4.  `lagoon login`を実行します。LagoonはSSHに接続し、公開/秘密キーペアに対して認証を行い、ユーザー名のトークンを取得します。

5. `lagoon whoami`を通じて検証します。それが ログインしています。

!!! Info "情報"
     一般的にはLagoon管理者ロールの使用を推奨していませんが、最初に始めるためには管理者アカウントを作成する必要があります。理想的には、管理者では_ない_別のアカウントをすぐに作成して作業を行います。
