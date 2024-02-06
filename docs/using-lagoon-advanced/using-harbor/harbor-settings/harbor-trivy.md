# Harbor-Trivy

Harbor-Trivy is configured via specific environment variables and does not use a config file.

## Environment Variables

* `SCANNER_LOG_LEVEL`
  * The logging level this service should use.
  * The default value is `error`.
    * This can be set to `debug` to enable very verbose logging.
* `SCANNER_STORE_REDIS_URL`
  * This value tells harbor-trivy how to connect to its Redis store.
  * The default value is `redis://harbor-redis:6379/4`.
* `SCANNER_JOB_QUEUE_REDIS_URL`
  * This value tells harbor-trivy how to connect to its Redis store.
  * The default value is `redis://harbor-redis:6379/4`.
* `SCANNER_TRIVY_VULN_TYPE`
  * This value tells harbor-trivy what types of vulnerabilities it should be searching for.
  * The default value is `os,library`
