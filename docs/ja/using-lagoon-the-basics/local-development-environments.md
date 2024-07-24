# ローカル開発環境

LagoonにはDockerと[Docker Compose](https://docs.docker.com/compose/)(ほとんどがDockerと一緒に出荷されています)にしか依存しませんが、Dockerに含まれていないローカル開発に役立つものがいくつかあります:

* ナイスなURLとHTTPSオフローディングのためのHTTPリバースプロキシ。
* IPアドレスを覚えておく必要がないDNSシステム。
* コンテナ内でSSHキーを使用するためのSSHエージェント。
* メールをローカルで受信して表示するシステム。

???+ warning
    ローカルでLagoonを使用するためにインストールする必要はありません！これは混乱するかもしれませんが、ドキュメントを参照してください。Lagoonはあなたのローカル開発環境を本番環境に**デプロイ**するシステムであり、環境そのものでは**ありません**。

## pygmy、DDEV、またはLando - 選択はあなた次第です。

### pygmy

Lagoonは伝統的に`pygmy`と最も良好に動作してきました。これは上記のツールのamazee.ioフレーバーシステムであり、Lagoonとそのまま動作します。これは[https://github.com/pygmystack/pygmy](https://github.com/pygmystack/pygmy)にあります。

`pygmy`はGolangで書かれているので、インストールするには次のコマンドを実行します:

```bash title="HomeBrewでのインストール"
brew tap pygmystack/pygmy && brew install pygmy
```

pygmyの詳細な使用方法やインストール情報については、その[ドキュメント](https://pygmystack.github.io/pygmy)を参照してください。

### Lando

LagoonはLandoと非常によく組み合わされています！詳細な情報は、[https://docs.lando.dev/config/lagoon.html](https://docs.lando.dev/config/lagoon.html)のドキュメントを参照して使用てください。

LandoのLagoon向けのワークフローはLandoのユーザーにとっては馴染み深いものであり、またLagoonの初心者が始めるのにも最も簡単な方法になります。一方、PygmyはDockerとより密接に統合されており、より複雑なシナリオやユースケースに適していますがより深い理解が必要になります。

### DDEV

LagoonはDDEVでもサポートされています！始めるためのドキュメントをチェックしてみてください。[https://ddev.readthedocs.io/en/stable/users/providers/lagoon/](https://ddev.readthedocs.io/en/stable/users/providers/lagoon/)。

以前には、[Docksal](https://docksal.io/)や[Docker4Drupal](https://wodby.com/docs/stacks/drupal/local/)などの他のシステムへのサポートを追加することを評価したことがありました。将来的にこれらのサポートを追加する可能性はありますが、現在のところは既存のツールへのサポートに焦点を当てています。
