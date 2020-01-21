# Logging

Lagoon provides access to the following logs via Kibana:

* Logs from the OpenShift Routers, including every single HTTP and HTTPs Request with:
  * Source IP
  * URL
  * Path
  * HTTP Verb
  * Cookies
  * Headers
  * User Agent
  * Project
  * Container name
  * Response Size
  * Response Time
* Logs from Containers
  * `stdout` and `stderr` messages
  * Container name
  * Project
* Lagoon Logs
  * Webhooks parsing
  * Build Logs
  * Build Errors
  * Any other Lagoon related Logs
* Application Logs
  * Any Logs sent by the running application
  * For Drupal: Install the [Lagoon Logs](https://www.drupal.org/project/lagoon_logs) module in order to receive Logs from Drupal Watchdog

To access the logs, please check with your Lagoon Administrator to get the URL for the Kibana Route \(for amazee.io this is [https://logs-db-ui-lagoon-master.ch.amazee.io/](https://logs-db-ui-lagoon-master.ch.amazee.io/)\).

Each Lagoon Account has their own login and will see the logs only for the projects that they have access to.

Also each account has their own **Kibana Tenant**, which means no saved searches or visualizations are shared with another account.

If you would like to know more on how to use Kibana: [https://www.elastic.co/webinars/getting-started-kibana](https://www.elastic.co/webinars/getting-started-kibana)

