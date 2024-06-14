# Ruby

[Lagoon `ruby` Dockerイメージ](https://github.com/uselagoon/lagoon-images/tree/main/images/ruby)。[公式のPython Alpineイメージ](https://hub.docker.com/_/ruby/)に基づいています。

## サポートされているバージョン { #supported-versions }

* 3.0 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby/3.0.Dockerfile) (2024年3月までのセキュリティサポート) - `uselagoon/ruby-3.0`
* 3.1 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby/3.1.Dockerfile) (2025年3月までのセキュリティサポート) - `uselagoon/ruby-3.1`
* 3.2 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/ruby/3.2.Dockerfile) (2026年3月までのセキュリティサポート) - `uselagoon/ruby-3.2`

!!! ヒント
    Lagoonは、公式に通知されたEOL日付の後にリリースされるLagoonリリースとともに、通常EOL Rubyイメージの更新と公開を停止します：[https://www.ruby-lang.org/en/downloads/releases/](https://www.ruby-lang.org/en/downloads/releases/)。以前のバージョンは利用可能なままです。

## Lagoonの適応 { #lagoon-adaptions }

rubyコンテナのデフォルトの公開ポートはポート`3000`です。

LagoonにはRubyサービスの「事前定義された」タイプはありません。それらは`lagoon.type: generic`とポートを`lagoonで設定する必要があります。 `.port: 3000`

## `docker-compose.yml` スニペット { #docker-composeyml-snippet }

```yaml title="docker-compose.yml"
ruby:
    build:
    # これは、ルートフォルダのDockerfileからのビルドを設定します
        context: .
        dockerfile: Dockerfile
        labels:
        # Lagoonにこれが一般的なサービスで、ポート3000を公開するように設定されていることを伝えます
            lagoon.type: generic
            lagoon.port: 3000
        ports:
        # ローカル開発のみ
        # これはポート3000をランダムなローカルポートで公開します
        # `docker-compose port ruby 3000`で見つけることができます
            - "3000"
```
