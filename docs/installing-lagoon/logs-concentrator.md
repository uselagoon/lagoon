# Logs-Concentrator

Logs-concentrator collects the logs being sent by Lagoon clusters and augments them with additional metadata before inserting them into Elasticsearch.

1. Create certificates according to ReadMe: [https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator)
2. Create `logs-concentrator-values.yaml` . See gist for example: [https://gist.github.com/Schnitzel/0c76bfdd2922a211aad38600485e7dc1](https://gist.github.com/Schnitzel/0c76bfdd2922a211aad38600485e7dc1)
3.  Install logs-concentrator: `helm upgrade --install --create-namespace --namespace lagoon-logs-concentrator -f logs-concentrator-values.yaml lagoon-logs-concentrator lagoon/lagoon-logs-concentrator`
