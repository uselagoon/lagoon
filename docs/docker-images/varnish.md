# Varnish

The [Lagoon `Varnish` Docker images](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish). Based on the [official `Varnish` package](https://hub.docker.com/_/varnish)

## Supported versions

* 5 \(available for compatibility only, no longer officially supported\) - `uselagoon/varnish-5`
* 6.0 LTS [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish/6.Dockerfile) - `uselagoon/varnish-6`
* 7 [Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish/7.Dockerfile) - `uselagoon/varnish-7`

## Included varnish modules

* [`vbox-dynamic`](https://github.com/nigoroll/libvmod-dynamic) - Dynamic backends from DNS lookups and service discovery from SRV records.
* [`vbox-bodyaccess`](https://github.com/aondio/libvmod-bodyaccess) - Varnish `vmod` that lets you access the request body.

## Lagoon adaptions

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.

## Included `default.vcl` configuration file

The image ships a _default_ `vcl` configuration file, optimized to work on Lagoon. Some options are configurable via environments variables \(see [Environment Variables](#environment-variables)\).

## Environment Variables

Some options are configurable via [environment
variables](../concepts-advanced/environment-variables.md).

| Environment Variable       | Default               | Description                                                                             |
| :------------------------- | :-------------------- | :-------------------------------------------------------------------------------------- |
| VARNISH_BACKEND_HOST       | NGINX                 | Default backend host.                                                                   |
| VARNISH_BACKEND_PORT       | 8080                  | Default listening Varnish port.                                                         |
| VARNISH_SECRET             | lagoon_default_secret | Varnish secret used to connect to management.                                           |
| LIBVMOD_DYNAMIC_VERSION    | 5.2                   | Default version of `vmod-dynamic` module.                                               |
| LIBVMOD_BODYACCESS_VERSION | 5.0                   | Default version of `vmod-bodyaccess` module.                                            |
| HTTP_RESP_HDR_LEN          | 8k                    | Maximum length of any HTTP backend response header.                                     |
| HTTP_RESP_SIZE             | 32k                   | Maximum number of bytes of HTTP backend response we will deal with.                     |
| NUKE_LIMIT                 | 150                   | Maximum number of objects we attempt to nuke in order to make space for an object body. |
| CACHE_TYPE                 | malloc                | Type of varnish cache.                                                                  |
| CACHE_SIZE                 | 500M                  | Cache size.                                                                             |
| LISTEN                     | 8080                  | Default backend server port.                                                            |
| MANAGEMENT_LISTEN          | 6082                  | Default management listening port.                                                      |
