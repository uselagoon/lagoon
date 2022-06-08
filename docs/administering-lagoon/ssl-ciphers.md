# Cipher Support

>_A cipher suite is a set of algorithms that help secure a network connection that uses Transport Layer Security (TLS) or its now-deprecated predecessor Secure Socket Layer (SSL). The set of algorithms that cipher suites usually contain include: a key exchange algorithm, a bulk encryption algorithm, and a message authentication code (MAC) algorithm._
>\- [Wikipedia](https://en.wikipedia.org/wiki/Cipher_suite)

Lagoon supports three default cipher suites, and also supports defining supported cipher suites directly. These cipher suites can be controlled by setting the `ROUTER_CIPHERS` environment variable. The three default selections available for this variable are: `modern`, `intermediate`, and `old`.

## Selectable Cipher Suites

Due to the versions of [HAProxy](http://www.haproxy.org/) and [OpenSSL](https://www.openssl.org/) in use by the router service, `modern` and `intermediate` are currently the same settings:

- Support for TLS `1.2`
- No support for `SSLv3`, TLS `1.0` or TLS `1.1`
- The following bind ciphers supported: ```ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384```

In order to allow more relaxed settings, we also support an `old` config:

- Support for TLS `1.2` and TLS `1.1`
- No support for `SSLv3` and TLS `1.0`
- The following bind ciphers supported: ```ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA```

## Custom Cipher Suites

If particular cipher settings are required, these can be provided via the environment vairable directly. TLS `1.0` and `SSLv3` will not be allowed no matter which cipher suites are requested.

## Version Information

Lagoon currently runs its router service based on OpenShift's `openshift3/ose-haproxy-router` image. This runs HAProxy version `1.8.1` and OpenSSL version `1.0.2k-fips`.