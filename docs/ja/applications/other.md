# Lagoon上で他のアプリケーションを実行する

たとえLagoonがあなたの特定のアプリケーション、フレームワーク、言語のための基本イメージを持っていなくても、Lagoonはそれを構築することができます！

[共通イメージ](../docker-images/commons.md)を拡張したり、継承したりすることで、Lagoonはほぼどんなワークロードでも実行することができます。

## Hugo

この簡単な例では、Hugoのウェブサイトを構築し、それをNGINXイメージの静的ファイルとして提供する方法を示しています。共通イメージはHugoの追加、サイトのコピー、構築のために使用されます。その後、NGINXイメージを使用してサイトを提供し、カスタマイズしたNGINX設定を追加します。

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