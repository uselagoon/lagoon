# Commons

[Lagoon `commons` Dockerイメージ](https://github.com/uselagoon/lagoon-images/tree/main/images/commons)。[公式のAlpineイメージ](https://hub.docker.com/_/alpine/)を基にしています。

このイメージ自体には機能はありませんが、代わりに基本イメージであり、他のイメージを構築するために拡張して利用されることを目的としています。Lagoonのすべてのalpineベースのイメージは、共有リソースからコンポーネントを継承しています。

## 含まれるツール

- `docker-sleep` - 標準化された1時間のスリープ
- `fix-permissions` - 指定したディレクトリのパーミッションを自動的に全グループの読み書き可能に修正
- `wait-for` - サービスが正しい順序で起動していることを保証する小さなスクリプト - https://github.com/eficode/wait-for を基にしています
- `entrypoint-readiness` - 長時間実行されるエントリーポイントが完了したことを確認
- `entrypoints` - /lagoon/entrypoints/* の下にあるすべてのエントリーポイントをアルファベット/数値順にソースするスクリプト

## 含まれるエントリーポイント

このイメージのデフォルトのエントリーポイントのリストは[https://github.com/uselagoon/lagoon-images/tree/main/images/commons/lagoon/entrypoints](https://github.com/uselagoon/lagoon-images/tree/main/images/commons/lagoon/entrypoints)で見つけることができます。それに続くダウンストリームのイメージ 最終的なイメージで実行される`/lagoon`の下にエントリーポイントを提供します。
