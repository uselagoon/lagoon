# lagoon-logstash

This is a logstash used within the amazee.io lagoon deployment system.

It connects to rabbitmq and creates a new `lagoon-logs:logstash` queue and binds it to the `lagoon-logs` exchange. Every message will be forwarded to Elasticsearch.