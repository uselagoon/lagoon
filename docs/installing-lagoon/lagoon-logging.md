# **Lagoon Logging**

Lagoon integrates with OpenSearch to store application, container and router logs. Lagoon Logging collects the application, router and container logs from Lagoon projects, and sends them to the logs concentrator.  It needs to be installed onto each `lagoon-remote` instance.

In addition, it should be installed in the `lagoon-core` cluster to collect logs from the `lagoon-core` service.  This is configured in the `LagoonLogs` section.

Logging Overview: [**https://lucid.app/lucidchart/b1da011f-2b91-4798-9518-4164b19d327d/view**](https://lucid.app/lucidchart/b1da011f-2b91-4798-9518-4164b19d327d/view)** **

See also: [Logging](../logging/logging.md).

Read more about Lagoon logging here: [https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging)

1. Create` lagoon-logging-values.yaml` . Here's an example gist: [https://gist.github.com/Schnitzel/57b6706dc32ddf9dd00e61c56d98f5cc](https://gist.github.com/Schnitzel/57b6706dc32ddf9dd00e61c56d98f5cc)
2. Install `lagoon-logging`:

    `helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com`

    `helm upgrade --install --create-namespace --namespace lagoon-logging -f lagoon-logging-values.yaml lagoon-logging lagoon/lagoon-logging`
3. If you'd like logs from `ingress-nginx` inside `lagoon-logging`:
   1. Add the content of this gist to `ingress-nginx: `[https://gist.github.com/Schnitzel/bba1a8a437f52fbf123ead1cc0406bf1](https://gist.github.com/Schnitzel/bba1a8a437f52fbf123ead1cc0406bf1)
