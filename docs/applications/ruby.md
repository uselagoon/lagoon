# Ruby and Ruby on Rails

## Introduction

We provide images for Ruby 3.0 and above, built on top of the official Ruby alpine docker images.

Below we assume that you're attempting to get a Rails app deployed on Lagoon, although most of the details described are really framework neutral.

## Getting Rails running on Lagoon

### Responding to requests

The [Ruby on Rails](https://github.com/lagoon-examples/ruby-on-rails) example in the Lagoon examples repository is instructive here.

In the [docker-compose.yml](https://github.com/lagoon-examples/ruby-on-rails/blob/main/docker-compose.yml) we set up a service named `ruby`, which is the primary service that will be processing any dynamic Requests.

If you look at the [dockerfile](https://github.com/lagoon-examples/ruby-on-rails/blob/main/lagoon/ruby.dockerfile) specified for the `ruby` service, you'll see that we're exposing port 3000. The `nginx` service will direct any requests for non-static assets to the `ruby` service on this port (see the [nginx configuration file](https://github.com/lagoon-examples/ruby-on-rails/blob/main/lagoon/nginx/nginx.conf) for more details).

### Logging

The Lagoon logging infrastructure is described in the [docs here](../logging/logging/). Essentially, in order to make use of the infrastructure, logs need to be sent via a UDP message to `udp://application-logs.lagoon.svc:5140`.

In our Rails example, we're importing the `logstash-logger` gem, and then in our `config/application.rb` we're initializing it with the following:

```
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

## Database configuration

The example uses our Postgresql image (see the docker-compose.yml file). Configuring database access in Rails for Lagoon is very straightforward. Since Lagoon injects the database host, name, and credentials as environment variables, we can just change our [`config/database.yml`](https://github.com/lagoon-examples/ruby-on-rails/blob/main/config/database.yml) to be aware of these env vars, and consume them if they exist.

```
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  username: <%= ENV.fetch("POSTGRES_USERNAME") { "drupal" } %>
  password: <%= ENV.fetch("POSTGRES_PASSWORD") { "drupal" } %>
  host: <%= ENV.fetch("POSTGRES_HOST") { "postgres" } %>
  database: <%= ENV.fetch("('POSTGRES_DATABASE'") { "drupal" } %>
```