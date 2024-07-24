# RubyとRuby on Rails

## はじめに

私たちは、公式の Ruby alpine Docker イメージをベースにした Ruby 3.0 以上のイメージを提供しています。
以下では、Rails アプリを Lagoon にデプロイしようとしていることを前提としていますが、ここで説明する詳細の多くは実際にはフレームワークに依存しません。

## Lagoon で Rails を実行する

### リクエストへの応答

Lagoonの例のリポジトリにある[Ruby on Rails](https://github.com/lagoon-examples/ruby-on-rails)の例が参考になります。

[`docker-compose.yml`](https://github.com/lagoon-examples/ruby-on-rails/blob/main/docker-compose.yml)では、動的リクエストを処理する主要サービスとして`ruby`という名前のサービスを設定しています。

`ruby`サービス用に指定された[dockerfile](https://github.com/lagoon-examples/ruby-on-rails/blob/main/lagoon/ruby.dockerfile)を見てみると、ポート3000を公開していることがわかります。`nginx`サービスは、非静的アセットのリクエストをこのポートの`ruby`サービスにリダイレクトします(詳細は[nginx設定ファイル](https://github.com/lagoon-examples/ruby-on-rails/blob/main/lagoon/nginx/nginx.conf)を参照してください)。

### ロギング

Lagoonのロギングインフラストラクチャについては、次の文書で説明されています。 [こちらのドキュメント](../logging/logging.md)をご覧ください。基本的に、このインフラを利用するためには、ログをUDPメッセージで`udp://application-logs.lagoon.svc:5140`に送信する必要があります。

Railsの例では、`logstash-logger`というgemをインポートし、その後`config/application.rb`で以下のように初期化しています：

```ruby title="config/application.rb"
    if ENV.has_key?('LAGOON_PROJECT') && ENV.has_key?('LAGOON_ENVIRONMENT') then
      lagoon_namespace = ENV['LAGOON_PROJECT'] + "-" + ENV['LAGOON_ENVIRONMENT']
      LogStashLogger.configure do |config|
        config.customize_event do |event|
          event["type"] = lagoon_namespace
        end
      end

      config.logstash.host = 'application-logs.lagoon.svc'
      config.logstash.type = :udp
      config.logstash.port = 5140
    end
```

## データベース設定

この例では、私たちのPostgreSQLイメージを使用しています(`docker-compose.yml`ファイルを参照してください)。LagoonでのRailsを用いたデータベースアクセスの設定は非常に簡単です。Lagoon はデータベース接続に必要な情報を環境変数として提供します。そのため、[`config/database.yml`](https://github.com/lagoon-examples/ruby-on-rails-demo/blob/main/config/database.yml) ファイルでこれらの環境変数を利用するように設定することで、簡単にデータベース接続を構成できます。

```yaml title="config/database.yml"
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: <%= ENV.fetch("POSTGRES_USERNAME") { "drupal" } %>
  password: <%= ENV.fetch("POSTGRES_PASSWORD") { "drupal" } %>
  host: <%= ENV.fetch("POSTGRES_HOST") { "postgres" } %>
  database: <%= ENV.fetch("'POSTGRES_DATABASE'") { "drupal" } %>
```
