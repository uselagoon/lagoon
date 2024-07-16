# Lagoonで他のアプリケーションを実行

Lagoonが特定のアプリケーション、フレームワーク、言語用のベースイメージを持っていなくても、Lagoonでビルドすることが可能です。

[commonsイメージ](../docker-images/commons.md)を拡張または継承することで、Lagoonはほぼあらゆるワークロードを実行できます。

## Hugo

この簡単な例は、Hugoウェブサイトをビルドし、NGINXイメージで静的ファイルとして提供する方法を示しています。commonsイメージを使用してHugoを追加し、サイトをコピーしてビルドします。その後、カスタマイズされたNGINX設定を追加したNGINXイメージを使用してサイトを提供します。

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
