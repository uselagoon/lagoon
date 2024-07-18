# ローカル開発環境

LagoonにはDockerと[Docker Compose](https://docs.docker.com/compose/)(ほとんどがDockerと一緒に出荷されています)に対する硬い依存性しかありませんが、Dockerに含まれていないローカル開発に役立つものがいくつかあります:

* ナイスなURLとHTTPSオフローディングのためのHTTPリバースプロキシ。
* IPアドレスを覚えておく必要がないDNSシステム。
* コンテナ内でSSHキーを使用するためのSSHエージェント。
* メールをローカルで受信し表示するシステム。

???+ warning
    ローカルでLagoonを_使用する_ためには、ローカルにLagoonを_インストール_する必要はありません！これは混乱するかもしれませんが、ドキュメンテーションを参照してください。Lagoonはあなたのローカル開発環境を本番環境に**デプロイ**するシステムであり、環境自体では**ありません**。

## pygmy、DDEV、またはLando - 選択はあなた次第

### pygmy

Lagoonは伝統的に`pygmy`と最も良好に動作してきました。これは上記のツールのamazee.ioフレーバーシステムであり、Lagoonとそのまま動作します。これは[https://github.com/pygmystack/pygmy](https://github.com/pygmystack/pygmy)にあります。

`pygmy`はGolangで書かれているので、インストールするには次のコマンドを実行します:

```bash title="HomeBrewでのインストール"
brew tap pygmystack/pygmy && brew install pygmy
```

pygmyの詳細な使用方法やインストール情報については、その[ドキュメンテーション](https://pygmystack.github.io/pygmy/)を参照してください。

### Lando

LagoonはLandoと非常によく組み合わされています！詳細な情報は、[https://docs.lando.dev/config/lagoon.html](https://docs.lando.dev/config/lagoon.html)のドキュメンテーションを参照して始めてください。

LandoのLagoon向けのワークフローは、Landoのユーザーにとっては馴染み深いものであり、またLagoonの初心者が始めるのにも最も簡単な方法になります。一方、PygmyはDockerとより密接に統合されており、より複雑なシナリオやユースケースにはより適していますが、より深い理解が必要になります。

### DDEV

LagoonはDDEVでもサポートされています！始めるためのドキュメンテーションをチェックしてみてください:[https://ddev.readthedocs.io/en/stable/users/providers/lagoon/](https://ddev.readthedocs.io/en/stable/users/providers/lagoon/)。

以前には、[Docksal](https://docksal.io/)や[Docker4Drupal](https://wodby.com/docs/stacks/drupal/local/)などの他のシステムへのサポートを追加することを評価していました。これらに将来的にサポートを追加する可能性はありますが、現在のところは、既存のツールへのサポートに焦点を当てています。
