# Tests

---

This document describes the tests that have been created.

---

## test-host.sh

This test is designed to check that an infrastructure component, that has been deployed by Helm, is available on both its external facing host name and its internal service name.  It will check for a HTTP response code of `200` from both endpoints.



```console
$ scripts/test-host.sh
1. Test that the host of a Helm release is contactable from outside the cluster.
2. Test that a service for a Helm release is contactable within the cluster.

pre-reqs:

The Python module 'yq' must be installed.

usage:
    ./test-host.sh -r <release_name> -h <host_path> -s <service_name> -p <service_port>

arguments:
    -r <release_name>, --release-name=<release_name>   is the Helm release name to test.
    -h <host_path>   , --host-path=<host_path>         is the host path within the Helm release values.
    -s <service_name>, --service-name=<service_name>   is the service name to test.
    -p <service_port>, --service-port=<service_port>   is the service port to test.

example:
    ./test-host.sh -r prometheus-dpc -h ".server.ingress.hosts[0]" -s prometheus-dpc-prometheus-dpc-server -p 80
```

Once the Prometheus server has been deployed, as per [these](metrics_install.md#prometheus) instructions, the following test will validate that it is available.

```console
$ ./test-host.sh \
    -r prometheus-dpc \
    -h ".server.ingress.hosts[0]" \
    -s prometheus-dpc-prometheus-dpc-server \
    -p 80

Found the following host:       prometheus-dpc.192.168.99.100.nip.io
Found the following NameSpace:  metrics
Host response code:             200
Service response code:          200
```

Once the Grafana server has been deployed, as per [these](metrics_install.md#grafana) instructions, the following test will validate that it is available.

```console
$ ./test-host.sh \
    -r grafana-dpc \
    -h ".server.ingress.hosts[0]" \
    -s grafana-dpc-grafana \
    -p 80

Found the following host:       grafana-dpc.192.168.99.100.nip.io
Found the following NameSpace:  metrics
Host response code:             200
Service response code:          200
```

If the test passes then the result code will be set to `0`.  This allows the script to become part of a Pipeline.

`curl` is used for both tests.  For the external host, `curl` is executed on the system where the script is run.  Therefore it is important that any proxies are appropriately configured, for example with the `https_proxy` environment variable.  For the internal service, `curl` is run on a short-lived `Pod` that is created in the same namespace as the `Service` that it is testing.