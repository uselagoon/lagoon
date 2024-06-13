# RubyとRuby on Rails

## 序章

私たちは、公式のRuby alpine Dockerイメージをベースに構築したRuby 3.0以上のイメージを提供しています。

以下では、Lagoon上でRailsアプリをデプロイしようとしていると仮定していますが、記述されている詳細のほとんどはフレームワークに関係なく適用可能です。

## Lagoon上でRailsを動作させる

### リクエストへの応答

Lagoonの例のリポジトリにある[Ruby on Rails](https://github.com/lagoon-examples/ruby-on-rails)の例は、ここで参考になります。

[`docker-compose.yml`](https://github.com/lagoon-examples/ruby-on-rails/blob/main/docker-compose.yml)では、`ruby`という名前のサービスを設定しています。これは、任意の動的リクエストを処理する主要なサービスです。

`ruby`サービス用に指定された[dockerfile](https://github.com/lagoon-examples/ruby-on-rails/blob/main/lagoon/ruby.dockerfile)を見てみると、ポート3000を公開していることがわかります。`nginx`サービスは、非静的アセットのリクエストをこのポートの`ruby`サービスにリダイレクトします（詳細は[nginx設定ファイル](https://github.com/lagoon-examples/ruby-on-rails/blob/main/lagoon/nginx/nginx.conf)を参照してください）。

### ロギング

Lagoonのロギングインフラストラクチャについては、次の文書で説明されています。 [こちらのドキュメント](../logging/logging.md)をご覧ください。基本的に、このインフラを利用するためには、ログをUDPメッセージで`udp://application-logs.lagoon.svc:5140`に送信する必要があります。

Railsの例では、`logstash-logger`というgemをインポートし、その後`config/application.rb`で以下のように初期化しています。

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

この例では、私たちのPostgreSQLイメージを使用しています（`docker-compose.yml`ファイルを参照してください）。LagoonでのRailsを用いたデータベースアクセスの設定は非常に簡単です。Lagoonはデータベースのホスト、名前、資格情報を環境変数として注入するため、[`config/database.yml`](https://github.com/lagoon-examples/ruby-on-rails/blob/main/config/database これらのenv varsを認識し、存在する場合はそれらを利用するように.yml)を設定します。

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
