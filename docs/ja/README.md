# Lagoon

![](./lagoon-logo.png)

## Lagoon - Kubernetes向けのオープンソースアプリケーションデリバリープラットフォーム

Lagoonは開発者が理想とするものを提供します。それは開発者がローカル環境と本番環境でまったく同じコードを実行することを可能にするシステムです。同じDockerイメージ、同じサービス設定、そして同じコードを実行することができます。

## はじめに

あなたがLagoonを使用してウェブサイトやアプリケーションをホストしたい場合は、[Lagoonの基本的な使い方](using-lagoon-the-basics/index.md)を参照してください。

Lagoonの機能についてより深く理解するためには、[Lagoonの高度な使い方](using-lagoon-advanced/index.md)をご覧ください。

Lagoonの仕組みを理解するためには、[Lagoonの基本的な概念](concepts-basics/index.md)を参照してください。

そして、より深い理解のために、[Lagoonの高度な概念](concepts-advanced/index.md)を参照してください。

あなたがLagoonを開発したい(機能を追加、バグを修正)場合は、[Lagoonの開発](contributing-to-lagoon/developing-lagoon.md)を参照してください。

## TL;DR: Lagoonの仕組み

1. 開発者は、YAML ファイル内で必要なサービスを定義、設定します。
2. 修正したコードを Git にプッシュします。
3. Lagoon は YAML ファイルを解析し、必要な構成を追加します。
4. Lagoon は必要な Docker イメージを構築します。
5. Lagoon はそれらを Docker レジストリにプッシュします。
6. Lagoon は Kubernetes に必要なリソースを作成します。
7. Lagoon はコンテナの展開を監視します。
8. すべてが完了すると、Lagoon はさまざまな方法 (Slack、メール、Web サイトなど) で開発者に通知します。

## ヘルプ

質問やアイデアがありましたらコードメンテナーやコントリビュータに会うことができます。

Lagoon Discordの会話へご参加ください：https://discord.gg/te5hHe95JE

## Lagoonについて
1. **Lagoon はマイクロサービスに基づいています**。デプロイメントとビルドのワークフローは非常に複雑です。複数のバージョン管理ソース、複数のクラスター、複数の通知システムがあります。各デプロイメントは1つ1つが特有のものであり、数秒から数時間かかる場合があります。柔軟性と堅牢性を考慮して構築されています。マイクロサービスはメッセージング システムを介して通信するため、個々のサービスをスケールアップおよびスケールダウンできます。これにより、個々のサービスのダウンタイムを乗り切ることができます。また、他の部分に影響を与えることなく、本番環境で Lagoon の新しい部分を試すこともできます。
2. **Lagoon では多くのプログラミング言語が使用されています**。各プログラミング言語にはそれぞれ固有の長所があります。私たちは、各サービスに最も適した言語を決定するよう努めています。現在、Lagoon の多くは Node.js で構築されています。これは最初にNode.jsを使い始めたからだけでなく、Node.jsがwebhooks、タスクなどの非同期処理を可能にするからです。一部のサービスのプログラミング言語を変更することを考えています。これはマイクロサービスの素晴らしいところであり、他のプラットフォームへの影響を懸念することなく、一つのサービスを別の言語で置き換えることができます。
3. **LagoonはDrupal特有のものではありません**。任意のDockerイメージを実行できるように構築されています。Drupal用の既存のDockerイメージがあり、DrushのようなDrupal特有のツールもサポートしていますが、Drupal特有の部分はそこだけです。
4. **LagoonはDevOpsです**。開発者が必要なサービスを定義し、必要に応じてカスタマイズすることができます。これが正しい方法でないと思うかもしれませんし、開発者にあまりにも多くの権限を与えていると思うかもしれません。しかし、私たちはシステムエンジニアとして、開発者を強化する必要があると考えています。開発者がローカルでサービスを定義し、それらをローカルでテストすることができれば、彼ら自身がバグやミスを見つけることができます。
5. **LagoonはDockerとKubernetes上で動作します。**
6. **Lagoonは完全にローカルで開発・テストが可能です。**
7. **Lagoonは完全に統合テストされています**。これは私たちが 全プロセスをテストできるということを意味します。Gitウェブフックの受信からDockerコンテナへのデプロイまで、同じGitハッシュがクラスタにデプロイされます。
8. **最も重要な点: これは進行中の作業です**。まだ終わりではありません。amazee.ioでは、ホスティングコミュニティとして、可能な限りコードを共有し、協力して作業を進める必要があると考えています。

私たちはあなたがLagoonのインフラストラクチャとサービスがどのように連携して動作するか、理解してもらえることを望んでいます。ここにスキーマがあります(少し古く、最近追加したサービスやKubernetesをカバーしていません。更新作業中です):[Lucid Chart](https://lucid.app/documents/view/cb441054-e04a-4389-b98b-c75bcda8ea0d)

## Lagoonの歴史

説明したように、Lagoonは理想を現実にしたものです。amazee.ioでは、Drupalを8年以上ホストしてきました。これは私たちのホスティングプラットフォームの4回目の大きな改訂です。3回目の改訂はPuppetとAnsibleを中心に構築されました。プラットフォームの各部分は全て設定管理で行われました。これにより新しいサーバーの設定が非常に速くできましたが、同時に開発者のカスタマイズの余地が不足していました。私たちはいくつかのカスタマイズを実装しましたが、すでにDockerを本番環境で使用していました。しかし、私たちはそのことに完全に満足していたわけではありません。私たちは、既存のプラットフォームだけでは足りないと気づきました。デカップルDrupalの台頭、サーバーサイドでのNode.jsの動作要求、Elasticsearchへの要望、異なるSolrバージョンなど、多くに対応する必要がありました。

同時に、私たちは長年にわたり、ローカル開発のためにDockerを使用してきました。本番環境で全てをDockerで行うというのは常に考えていました。唯一の問題は、ローカル開発と本番環境との連携でした。他にも、本番環境でDrupalをDockerで動作させるシステムが存在します。しかし、ローカルと本番環境で正確に同じイメージとサービスをテストすることを許可するものは何もありませんでした。

Lagoonは2017年に誕生しました。それ以来、本番環境でDockerを動作させるシステムに発展しました。Lagoonは、我々の第3世代のホスティングプラットフォームを、最先端の全Dockerベースのシステムに置き換えました。

### オープンソース

amazee.ioでは、オープンソースの可能性を信じています。Drupalのようなオープンソースコードが独占的なホスティングプラットフォームでホストされていることは常に我々にとって問題でした。ホスティング会社の強さと成功は、単にデプロイメントシステムやサービスの設定だけではありません。それはプラットフォームを動かす人々と知識です。 プロセス、スキル、予期しない状況に対応する能力、そして最後に忘れてはならないのは、彼らがクライアントに提供するサポートです。

### ライセンス

Lagoonは、[`Apache 2.0 ライセンス`](https://github.com/uselagoon/lagoon/blob/main/LICENSE)の下で利用可能です。
