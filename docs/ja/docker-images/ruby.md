# Ruby

[Lagoon `ruby` Dockerイメージ](https://github.com/uselagoon/lagoon-images/tree/main/images/ruby)。[公式のPython Alpineイメージ](https://hub.docker.com/_/ruby/)をベースに作成されています。


## サポートされているバージョン { #supported-versions }

* 3.0 (互換性のためだけに利用可能、公式にはサポートされていません) - `uselagoon/ruby-3.0`
* 3.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby/3.1.Dockerfile) (2025年3月までのセキュリティサポート) - `uselagoon/ruby-3.1`
* 3.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby/3.2.Dockerfile) (2026年3月までのセキュリティサポート) - `uselagoon/ruby-3.2`
* 3.3 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby/3.3.Dockerfile) (2027年3月までのセキュリティサポート) - `uselagoon/ruby-3.3`

!!! Tip "ヒント"
    Lagoonは、公式にアナウンスされた終了日(EOL)の後にリリースされるバージョンで、EOLに達したRubyイメージの更新を停止します。詳細は[https://www.ruby-lang.org/en/downloads/releases/](https://www.ruby-lang.org/en/downloads/releases/)を参照して下さい。

## Lagoonの適応 { #lagoon-adaptions }

rubyコンテナのデフォルトの公開ポートはポート`3000`です。

LagoonにはRubyサービス専用の事前定義された型はありません。`lagoon.type: generic`を使用して構成し、lagoon.port: 3000 でポートを設定する必要があります。

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
ruby:
    build:
    # ルートフォルダにあるDockerfileを使用してビルドを行うように設定します。
        context: .
        dockerfile: Dockerfile
        labels:
        # Lagoonにこれが一般的なサービスで、ポート3000を公開するように設定されていることを伝えます
            lagoon.type: generic
            lagoon.port: 3000
        ports:
        # ローカル開発のみ適用される設定です
            # ポート3000をランダムなローカルポートにマッピングし、
            # `docker-compose port node 3000`でポートを確認することができます。
            - "3000"
```
