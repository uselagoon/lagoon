# nginx Image
amazee.io Alpine 7 Dockerfile with nginx installed, based on the official openresty Alpine images at (https://hub.docker.com/r/openresty/openresty/).

This Dockerfile is intended to be used as base for any webservers within amazee.io. By default the nginx only serves static files. If you need php have a look at the php-fpm image and use nginx and php-fpm in tandem.

## amazee.io & OpenShift adaptions
This image is prepared to be used on amazee.io which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/core/root/usr/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- The files within `/etc/nginx/*` are parsed through [envplate](https://github.com/kreuzwerker/envplate) with an container-entrypoint.

## Included Nginx configuration (static-files.conf)
By default nginx only serves static files - this can be used for static sites that don't require a database or php components e.g. Static site generators like Hugo, Jekyll or Gatsby. Simply build the content during the build process and inject it into the nginx container.

## Helpers
### redirects-map.conf
In order to create redirects we have the redirects-map.conf in place. This helps you to redirect marketing domains to subsites or do non-www to www redirects.
If you have a lot of redirects we suggest to have the `redirects-map.conf` stored next to your code for easier maintainability.
If you just have a few redirects there's a handy trick to create the redirects with a `RUN` command in your `nginx.dockerfile`.


Example for redirecting `www.example.com` to `example.com` and preserving the request.

```
RUN echo "~^www.example.com           http://example.com\$request_uri;" >> /etc/nginx/redirects-map.conf

```

To get more details about the various types of redirects that can be achieved see the documentation within the [redirects-map.conf](https://github.com/amazeeio/lagoon/blob/master/images/nginx/redirects-map.conf) directly.

After you put the `redirects-map.conf` in place you also need to include it in your `nginx.dockerfile` in order to get
the configuration file into your build.

```
COPY redirects-map.conf /etc/nginx/redirects-map.conf
```

### Basic Authentication
If you want to protect your site via Basic Authentication you can do this by defining the environment variables `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` within your .lagoon.env.environment files.


## Environment Variables
Environment variables are meant to do common behavior changes of php.

| Environment Variable              | Default   | Description                                    |
| --------------------------------- | --------- | ---------------------------------------------- |
| `BASIC_AUTH_USERNAME`             | (not set) | Username for basic Authentication              |
| `BASIC_AUTH_PASSWORD`             | (not set) | Password for basic authentication (unencrypted)|
