# Cipher Support
Lagoon supports three default cipher suites, and also supports defining supported cipher suites directly. These cipher suites can be controlled by setting the `ROUTER_CIPHERS` environment variable. The three default selections available for this variable are: `modern`, `intermediate`, and `old`.  

## Selectable Cipher Suites
Due to the versions of HAProxy and OpenSSL in use by the router service, `modern` and `intermediate` are currently the same settings:
- Support for TLS `1.2`
- No support for `SSLv3`, TLS `1.0` or TLS `1.1`
- The following bind ciphers supported: ```ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384```

In order to allow more relaxed settings, we also support an `old` config:
- Support for TLS `1.2`, TLS `1.1`, and TLS `1.0`
- No support for `SSLv3`
- The following bind ciphers supported: ```ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA```

## Custom Cipher Suites
If particular cipher settings are required, these can be provided via the environment vairable directly, with the same TLS versions allowed as the `intermediate` settings.

## Version Information
Lagoon currently runs its router service based on OpenShift's `openshift3/ose-haproxy-router` image, which runs HAProxy version `1.8.1` and OpenSSL version `1.0.2k-fips`.