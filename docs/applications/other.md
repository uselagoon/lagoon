# Running other applications on Lagoon

Even if Lagoon doesn't have a base image for your particular application, framework or language, Lagoon can still build it!

Extending on, or inheriting from the [commons image](../docker-images/commons.md), Lagoon can run almost any workload.

## Hugo

This brief example shows how to build a Hugo website and serve it as static files in an NGINX image. The commons image is used to add Hugo, copy the site in, and build it. The NGINX image is then used to serve the site, with the addition of a customized NGINX config.

```bash title="nginx.dockerfile"
FROM uselagoon/commons as builder

RUN apk add hugo git
WORKDIR /app
COPY . /app
RUN hugo

FROM uselagoon/nginx

COPY --from=builder /app/public/ /app
COPY lagoon/static-files.conf /etc/nginx/conf.d/app.conf

RUN fix-permissions /usr/local/openresty/nginx
```

```yaml title="docker-compose.yml"
services:
  nginx:
    build:
      context: .
      dockerfile: lagoon/nginx.Dockerfile
    labels:
      lagoon.type: nginx
```
