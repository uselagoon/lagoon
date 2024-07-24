# Commons

[Lagoon `commons` Dockerイメージ](https://github.com/uselagoon/lagoon-images/tree/main/images/commons)。[公式のAlpineイメージ](https://hub.docker.com/_/alpine/)をベースにしています。

このイメージ自体は機能を持ちません。代わりに、他のイメージをビルドするための基本イメージとして使用されます。Lagoon内のすべてのalpineベースのイメージは、commonsからコンポーネントを継承しています。

## ツール

- `docker-sleep` - 標準化された1時間のスリープ機能
- `fix-permissions` - 指定したディレクトリのパーミッションを自動的に全グループの読み書き可能に変更
- `wait-for` - サービスが正しい順序で起動していることを確認する小さなスクリプト - https://github.com/eficode/wait-for を基にしています
- `entrypoint-readiness` - 長時間実行されるエントリーポイントが完了したことを確認
- `entrypoints` - /lagoon/entrypoints/* ディレクトリ内のすべてのエントリーポイントをアルファベット順/数値順に読み込むスクリプト

## エントリーポイント

このイメージのデフォルトのエントリーポイントの一覧は[https://github.com/uselagoon/lagoon-images/tree/main/images/commons/lagoon/entrypoints](https://github.com/uselagoon/lagoon-images/tree/main/images/commons/lagoon/entrypoints)にあります。以降の下流イメージも、`/lagoon`配下にエントリーポイントを追加でき、最終的なイメージで実行さます。
