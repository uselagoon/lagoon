# amazee.io centos7 nginx

amazee.io CentOS 7 Dockerfile with nginx installed, based on amazeeio/centos:7 Docker Image.

This Dockerfile is intended to be used as an base for any nginx needs within amazee.io. It does *not* create any nginx server configs by itself. So running it out of the box will not do a lot of things :)

- Nginx is installed via epel-release. 
- Site configs are expected inside `/etc/nginx/sites`

## amazee.io & OpenShift adaptions

This image is prepared to be used on amazee.io which leverages OpenShift. There are therefore some things already done:

- Folder permissions are automatically adapted with [`fix-permissions`](https://github.com/sclorg/s2i-base-container/blob/master/bin/fix-permissions) so this image will work with a random user and therefore also on OpenShift.
- all files within `/etc/nginx/` and `/etc/nginx/sites/` are parsed through [envplate](https://github.com/kreuzwerker/envplate) with an container-endpoint.

## Included nginx config

The included nginx config contains sane values that will make the creation of site configs easier. Here a list these. Plus check `nginx.conf` for all of it:

- Error and access logging happens to `/dev/stdout` the level can be adapted via `NGINX_ERROR_LOG_LEVEL` (see below)
- gzip is activated
- root is assumed to be in `/app` (change in site config if you need a subfolder)
- proxy settings have longer timeouts
- fastcgi.conf with adapted values is included by default (see `fastcgi.conf` for them)
- on Port 50000 at path `/nginx_status` there is an nginx status page running, access is only allowed from localhost and local ip ranges

## Environment Variables

Environment variables are meant to do common behavior changes of nginx. If you need more then these it is best to replace the `nginx.conf` file all together.

| Environment Variable | Default | Description  | 
|--------|---------|---|
| `NGINX_ERROR_LOG_LEVEL` | `notice` | Determines the level of logging from nginx, and can be one of the following: `debug`, `info`, `notice`, `warn`, `error`, `crit`, `alert`, or `emerg`. More at [nginx.org](http://nginx.org/en/docs/ngx_core_module.html#error_log) |

## Example Site Config

### Just serve static files on port 8080

    server {

        listen       8080;

        location / {
            index index.html index.htm;
            try_files $uri $uri/ =404;
        }

    }

### Listen on Port 8080 forward to PHP-FPM running on port 9000

    server {

        listen       8080;

        location ~ [^/]\.php(/|$) {
            fastcgi_pass 127.0.0.1:9000;
        }

    }