# NGINX

The [Lagoon `nginx` image Dockerfile](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx/Dockerfile). Based on the official [`openresty/openresty` images](https://hub.docker.com/r/openresty/openresty/).

This Dockerfile is intended to be used as a base for any web servers within Lagoon.

## Lagoon adaptions

The default exposed port of NGINX containers is port `8080`.

This image is prepared to be used on Lagoon. There are therefore some things already done:

* Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/uselagoon/lagoon-images/blob/main/images/commons/fix-permissions), so this image will work with a random user.
* The files within `/etc/nginx/*` are parsed through [`envplate`](https://github.com/kreuzwerker/envplate) with a container-entrypoint.

## Included `NGINX` configuration \(`static-files.conf`\)

!!! warning
    By default `NGINX` only serves static files - this can be used for static sites that don't require a database or PHP components: for example, static site generators like [Hugo](https://gohugo.io/), [Jekyll](https://jekyllrb.com/) or [Gatsby](https://www.gatsbyjs.org/).

If you need PHP, have a look at the `php-fpm` image and use `nginx` and `php-fpm` in tandem.

Build the content during the build process and inject it into the `nginx` container.

## Helpers

### `redirects-map.conf`

In order to create redirects, we have `redirects-map.conf` in place. This helps you to redirect marketing domains to sub-sites or do non-www to www redirects. **If you have a lot of redirects, we suggest having `redirects-map.conf` stored next to your code for easier maintainability.**

!!! Note
    If you only have a few redirects, there's a handy trick to create the redirects with a `RUN` command in your `nginx.dockerfile`.

Here's an example showing how to redirect `www.example.com` to `example.com` and preserve the request:

```bash title="Redirect"
RUN echo "~^www.example.com http://example.com\$request_uri;" >> /etc/nginx/redirects-map.conf
```

To get more details about the various types of redirects that can be achieved, see the documentation within the [`redirects-map.conf`](https://github.com/uselagoon/lagoon-images/blob/main/images/nginx/redirects-map.conf) directly.

After you put the `redirects-map.conf` in place, you also need to include it in your `nginx.dockerfile` in order to get the configuration file into your build.

```bash title="nginx.dockerfile"
COPY redirects-map.conf /etc/nginx/redirects-map.conf
```

### Basic Authentication

Basic authentication is enabled automatically when the `BASIC_AUTH_USERNAME`
and `BASIC_AUTH_PASSWORD` [environment
variables](../using-lagoon-advanced/environment-variables.md) are set.

!!! warning
    Automatic basic auth configuration is provided for convenience. It should not be considered a secure method of protecting your website or private data.

## Environment Variables

Some options are configurable via [environment
variables](../using-lagoon-advanced/environment-variables.md).

| Environment Variable | Default    | Description |
| :------------------- | :--------- | :--- |
| BASIC_AUTH           | restricted | Set to `off` to disable basic authentication.                                                                                                                  |
| BASIC_AUTH_USERNAME  | (not set)  | Username for basic authentication.                                                                                                                             |
| BASIC_AUTH_PASSWORD  | (not set)  | Password for basic authentication (unencrypted).                                                                                                               |
| FAST_HEALTH_CHECK    | (not set)  | Set to `true` to redirect GET requests from certain user agents (StatusCake, Pingdom, Site25x7, Uptime, nagios) to the lightweight Lagoon service healthcheck. |
