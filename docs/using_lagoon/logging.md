# Logging

Lagoon provides access to the following logs via Kibana:

- Logs from the OpenShift Routers, including every single HTTP and HTTPs Request with:
    - Source IP
    - URL
    - Path
    - HTTP Verb
    - Cookies
    - Headers
    - User Agent
    - Project
    - Container name
    - Response Size
    - Response Time
- Logs from Containers
    - stdout and stderr messages
    - Container name
    - Project
- Lagoon Logs
    - Webhooks parsing
    - Build Logs
    - Build Errors
    - Any other Lagoon related Logs
- Application Logs (via Syslog) **WIP (not completed yet)**
    - Any Logs sent by the running application via Syslog (Example: Drupal Watchdog)


To access the Logs, please check with your Lagon Administrator to get the URL for the Kibana Route (for amazee.io this is https://logs-db-ui-lagoon-master.ch.amazee.io/).

Each Lagoon Account has their own Login and will see the Logs only for the projects that they have access to.

Also each Account has their own Kibana Tenant, which means no saved searches or visualizations are shared with another Account.

If you like to know more on how to use Kibana: https://www.elastic.co/webinars/getting-started-kibana