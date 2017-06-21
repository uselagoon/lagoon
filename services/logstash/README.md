# amazeeio-logstash

This is a logstash used within the amazee.io lagoon deployment system.

It connects to rabbitmq and creates a new `amazeeio-logs:logstash` queue and binds it to the `amazeeio-logs` exchange. Every message will be forwarded to Elasticsearch.