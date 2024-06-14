# Lagoonドキュメンテーションへの貢献

皆さんからいただけるものは何でも大いに評価します！

ドキュメンテーションの作成と閲覧を非常に簡単にしており、チームは常にレビューやヒントを提供するために準備ができています。

私たちは優れた[Material](https://squidfunk.github.io/mkdocs-material/)テーマと共に[mkdocs](https://www.mkdocs.org/)を使用しています。

## ローカルでのドキュメンテーションの閲覧と更新

Lagoonリポジトリのルートから(Dockerが必要です)、以下を実行します:

```bash title="Get local docs up and running."
docker run --rm -it -p 127.0.0.1:8000:8000 -v ${PWD}:/docs ghcr.io/amazeeio/mkdocs-material
```

<!-- markdown-link-check-disable-next-line -->
これにより、任意の更新でライブリロードが設定された開発サーバーが [http://127.0.0.1:8000](http://127.0.0.1:8000)で起動します。

カスタマイズされたDockerイメージには、必要なすべての拡張機能が含まれています。

あるいは、`mkdocs`パッケージをローカルで実行するには、mkdocsをインストールし、必要なすべてのプラグインをインストールする必要があります。

```bash title="Install mkdocs"
pip3 install -r docs/requirements.txt
mkdocs serve
```

## クラウドでの編集

各ドキュメンテーションページには、右上に"編集"の鉛筆アイコンがあり、それをクリックすると正しいページに移動します。 Gitリポジトリにて。

こちらでもお気軽に貢献していただけます。組み込みの[github.dev webベースのエディター](https://docs.github.com/en/codespaces/the-githubdev-web-based-editor)をいつでも使用できます。基本的なマークダウンのプレビューがありますが、mkdocsの素晴らしさはありません。

## ドキュメンテーションのデプロイ方法

私たちは[Deploy MkDocs](https://github.com/marketplace/actions/deploy-mkdocs) GitHubアクションを使用して、すべてのメインブランチのプッシュをビルドし、`gh-pages` ブランチのデプロイメントをトリガーします。
