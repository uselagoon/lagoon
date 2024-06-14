# 貢献

我々はLagoonへのあらゆる種類の貢献を心から歓迎します！

## どのような貢献が必要ですか？ { #what-kind-of-contributions-do-we-need }

Lagoonはどんな種類の貢献でも恩恵を受けます - バグ修正、新機能、ドキュメンテーションの更新、あるいは単純なキューのメンテナンスなど - あなたが助けてくれることを我々は嬉しく思います。

### Lagoonの開発 { #developing-for-lagoon }

Lagoonをあなたのローカルマシン上で動かす方法について、KinDを使用した[Developing Lagoon](contributing-to-lagoon/developing-lagoon.md)というセクション全体があります。このドキュメンテーションはまだ非常にWIPですが、あなたを助けるための多くのMakefileルーチンが存在します。

### Lagoonのインストール { #installing-lagoon }

我々はLagoonをHelmチャートからインストールする方法を概説した別のセクションを持っています。その名も[Installing Lagoon Into Existing Kubernetes Cluster](installing-lagoon/requirements.md) - このプロセスを可能な限りスムーズにしたいと考えています！

### 我々の例題での助け { #help-us-with-our-examples }

現在、我々の最大のニーズの一つは、LagoonがDrupal以外の各種のコンテンツマネジメントシステムなどとどのように動作するかの例をまとめることです。

もし、あなたが現在我々がDocker Composeスタックとして持っていないオープンソースCMSまたはフレームワークを立ち上げることができれば、PRを送ってください。既存の例を[https://github.com/uselagoon/lagoon-ex](https://github.com/uselagoon/lagoon-ex)でご覧ください。 ヒント、アドバイス、スターターの問題については、[examples](https://github.com/uselagoon/lagoon-examples)をご覧ください。

ただし、可能な限り、基本のDocker Hubイメージ[https://hub.docker.com/u/uselagoon](https://hub.docker.com/u/uselagoon)を使用して作成していただきたいと考えています。適切なイメージがない場合や、当社のイメージを変更する必要がある場合は、PR（可能な場合）を投げていただくか、問題を作成してください（他の誰かが対応できるように）[https://github.com/uselagoon/lagoon-images](https://github.com/uselagoon/lagoon-images)にて。

既存の例を改善するために私たちを手伝ってください、もしご可能であれば - 私たちは最良の方法を追求しているのでしょうか、何か意味のないことをしているのでしょうか？

これらの例のいずれかのテストに貢献する人にはボーナスポイントがあります – [https://github.com/amazeeio/drupal-example-simple/blob/8.x/TESTING\_dockercompose.md](https://github.com/amazeeio/drupal-example-simple/blob/8.x/TESTING_dockercompose.md)のプロジェクトにいくつかの例テストがありますので、それらをガイダンスに使用してください。私たちが使用しているテストフレームワークは、[Lando](https://lando.dev/)の優れたチームからの[Leia](https://github.com/lando/leia)です。

他の例のドキュメンテーションを改善するために私たちを手伝ってください – 私たちは完全なものを期待していませんが、 原稿、整理、役立つリソースへのリンク、明確な声明は全て超素晴らしいです。

何か質問がある場合は、[Discord](https://discord.gg/te5hHe95JE)で私たちに連絡してください！

## セキュリティの問題を見つけました 🔓 { #i-found-a-security-issue }

私たちはセキュリティを非常に重視しています。 セキュリティの問題を発見したり、発見したと思ったら、是非メンテナに注意を促してください。

!!! 危険
    結果を[security@amazee.io](mailto:security@amazee.io)に送ってください。 GitHubの問題としてそれらをファイルしては**絶対に**しないでください。

セキュリティレポートは非常に評価され、公共のカルマとスワッグがもらえます！ 私たちはまた、バグバウンティシステムの作業も進めています。

## 問題を見つけました { #i-found-an-issue }

私たちは常に問題を解決することに興味がありますので、問題報告は大歓迎です。 あなたの問題がすでに[問題キュー](https://github.com/uselagoon/lagoon/issues)に存在しないことを確認してください。

## 機能の要望やアイデアがあります { #i-have-a-feature-request-or-idea }

素敵です！ [問題](https://github.com/uselagoon/lagoon/issues)を作成していただければ、私たちはそれを検討することを喜びます。 それが実装されることを保証することはできません。 しかし、私たちは常にLagoonに何をもたらすことができるかのアイデアを聞くことに興味があります。

別の良い方法は、あなたのアイデアについてDiscord経由で私たちと話すこともです。 . [今日参加してください](https://discord.gg/te5hHe95JE)！

## 私はいくつかのコードを書きました { #i-wrote-some-code }

素晴らしい！それについてプルリクエストをお送りください、可能な限りレビューし、可能であればマージします。
