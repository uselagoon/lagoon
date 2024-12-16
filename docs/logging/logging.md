# Logging

Lagoon provides access to the following logs:

* Logs from the Kubernetes Routers, including every single HTTP and HTTPS request with:
  * Source IP
  * URL
  * Path
  * HTTP verb
  * Cookies
  * Headers
  * User agent
  * Project
  * Container name
  * Response size
  * Response time
* Logs from containers:
  * `stdout` and `stderr` messages
  * Container name
  * Project
* Lagoon logs:
  * Webhooks parsing
  * Build logs
  * Build errors
  * Any other Lagoon related logs
* Application logs:
  * For Drupal: install the [Lagoon Logs](https://www.drupal.org/project/lagoon_logs) module in order to receive logs from Drupal Watchdog.
  * For Laravel: install the [Lagoon Logs for Laravel](https://github.com/amazeeio/laravel_lagoon_logs) package.
  * For other workloads:
    * Send logs to `udp://application-logs.lagoon.svc:5140`
    * Ensure logs are structured as JSON encoded objects.
    * Ensure the `type` field contains the name of the Kubernetes namespace (`$LAGOON_PROJECT-$LAGOON_ENVIRONMENT`).



