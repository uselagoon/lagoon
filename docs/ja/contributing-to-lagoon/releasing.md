# Lagoonのリリース

Lagoonには多くの動的な部分があるため、リリースはかなり複雑です！

## Lagoon-core - タグとテスト

1. 次の全ての特定されたプルリクエストがメインブランチにマージされていることを確認します：
  - [uselagoon/lagoon](https://github.com/uselagoon/lagoon)
  - [uselagoon/build-deploy-tool](https://github.com/uselagoon/build-deploy-tool)
  - [uselagoon/lagoon-ui](https://github.com/uselagoon/lagoon-ui)
2. 確認が終わったら、次のタグ（マイナーまたはパッチ）をメインブランチにプッシュします。フォーマットはv2.MINOR.PATCHとし、[semver](https://semver.org/)に従います。これにより、Jenkinsビルドがトリガーされ、https://ci.lagoon.sh/blue/organizations/jenkins/lagoon/branches で見ることができます。
3. これがビルド中の間、`lagoon-ui` と `build-deploy-tool` の適切なコミットに軽量タグをプッシュします。フォーマットは core-v2.MINOR.PATCH とします。build-deploy-toolには他のタグやリリースはありませんが、lagoon-uiには独自のsemverリリースがあり、これはその機能に基づいています。
4. Jenkinsでのビルドが成功したら、https://github.com/uselagoon/lagoon-charts に移動して、チャートリリースの準備をします。
5. `lagoon-core` と `lagoon-test` チャートのchart.yamlで、更新します。 以下のフィールド：
  - **バージョン：** これはチャートの次の「マイナー」リリースで、通常は対応するlagoon-coreリリースのためのマイナーを使用します
  - **appVersion：** これはリリースされたlagoon-coreの実際のタグです
  - **artifacthub.io/changes：** 必要なのは以下のスニペットの2行で、リリースされる実際のappVersionに合わせて変更されます。

  ```yaml title="sample chart.yml snippets"
  # これはチャートのバージョンです。このバージョン番号は、アプリ
  # バージョンを含む、チャートとそのテンプレートに変更を加えるたびに増やすべきです。
  # バージョンはセマンティックバージョニング（https://semver.org/）に従うことが期待されます。
  version: 1.28.0

  # これはデプロイされるアプリケーションのバージョン番号です。このバージョン
  # 番号は、アプリケーションに変更を加えるたびに増加させるべきです。
  # バージョンはセマンティックバージョニングに従うことが期待されません。それらは
  # アプリケーションが使用しているバージョンを反映するべきです。
  appVersion: v2.14.2

  # このセクションは、artifacthub.ioのチェンジログを収集するために使用されます
  # それは各リリースごとに新たに開始されるべきです
  # 有効なサポートされている種類は、追加、変更、非推奨、削除、修正、セキュリティがあります
  annotations:
  artifacthub.io/changes: |
      - 種類: 変更
        説明: Lagoon appVersionをv2.14.2に更新
  ```
  lagoon-coreリリースの結果、lagoon-coreとlagoon-testのチャートのみが更新されます。他に変更がある場合は、lagoon-remoteのプロセスに従ってください。

6. このチャートリリースのPRを作成し、Github Actionsスイートが一連のテストを実施します:
  - **Lintとテストチャート - マトリクス:** 現在テストされているKubernetesバージョンに対してlintとチャートのインストールを行います
  - **Lintとテストチャート - current:** 以前/将来のKubernetesバージョンに対してlintとチャートのインストールを行います
  - **Lagoon tests:** リリースに対してansibleテストの全シリーズを実行します。

  通常、lintとテストチャートの失敗はよく説明されています（チャート設定の欠落/誤設定）。単一のLagoonテストが失敗する場合は、再実行するだけでかもしれません。複数の失敗が発生した場合は、調査が必要です。

これらのテストがすべて成功した後、リリースの作成を進めることができます:

## Lagoon-core - リリースとリリースノート

1. [uselagoon/lagoon](https://github.com/uselagoon/lagoon)で、先ほどプッシュしたタグからリリースを作成します。"リリースの生成 "notes"ボタンを使って変更履歴を作成します。リリースに含める内容については、以前のリリースを参照してください。 また、lagoon-imagesのリンクは常に最新のリリース版となります。チャート、lagoon-ui、build-deploy-toolへのリンクはすべて今すぐ埋めることができますが、リンクは今後のステップが完了するまで動作しません。これを最新のリリースとしてマークし、リリースを公開します。
2. [uselagoon/build-deploy-tool] (https://github.com/uselagoon/build-deploy-tool)で、先ほどプッシュしたタグからリリースを作成します。"リリースノートを生成"ボタンを使用して変更履歴を作成します。最後のcore-v2.Xタグが使用され、他のタグは使用されないことを確認します。リリースに含める内容については、以前のリリースを参照してください。これを最新のリリースとしてマークし、リリースを公開します。
3. [uselagoon/lagoon-ui] (https://github.com/uselagoon/lagoon-ui)で、先ほどプッシュしたタグからリリースを作成します。"リリースノートを生成"ボタンを使用して変更履歴を作成します。最後のcore-v2.Xタグが使用され、他のタグは使用されないことを確認します。リリースに含める内容については、以前のリリースを参照してください。これを最新のリリースとしてマークし、リリースを公開します。
4. [uselagoon/lagoon-charts] (https://github.com/uselagoon/lagoon-charts)で 成功したPRをマージすると、lagoon-coreとlagoon-testのリリースが作成されます。結果として得られたlagoon-coreチャートリリースを編集し、タイトルとテキストボックスに対応するlagoonリリースを記載します。以前のリリースと同様にします。

## Lagoonリモート - リリースとリリースノート

Lagoon remoteはLagoon Coreとは別のリリースサイクルを持ち、そのため、依存関係のあるサブチャートやサービスが更新されるたびにリリースすることができます。
