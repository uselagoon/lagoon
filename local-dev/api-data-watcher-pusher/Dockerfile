FROM alpine:3.11

RUN apk add --no-cache \
      bash \
      gettext \
      moreutils \
      py3-jwt \
      tini \
      wget

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev \
    GIT_HOST="172.17.0.1" \
    GIT_PORT="2222" \
    INGRESS_IP="172.17.0.1"

COPY api-data /api-data
COPY api-watch-push.sh create_jwt.py /home/

CMD ["tini", "--", "/home/api-watch-push.sh"]
