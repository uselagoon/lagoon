FROM alpine:3.12

RUN apk add --no-cache tini bash wget py3-jwt

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev

COPY api-watch-push.sh create_jwt.py /home/

CMD ["tini", "--", "/home/api-watch-push.sh"]
