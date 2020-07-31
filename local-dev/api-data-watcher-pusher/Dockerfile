FROM python:3.8.5-alpine3.11

RUN apk add --no-cache tini bash wget
RUN pip install mysql-connector python-keycloak PyJWT

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev

COPY api-watch-push.sh create_jwt.py /home/

CMD ["tini", "--", "/home/api-watch-push.sh"]