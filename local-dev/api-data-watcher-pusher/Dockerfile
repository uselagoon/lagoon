FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

RUN apk add --no-cache \
      bash \
      gettext \
      minio-client \
      moreutils \
      py3-jwt \
      tini \
      wget

ENV JWTSECRET=super-secret-string \
    JWTAUDIENCE=api.dev \
    GIT_HOST="172.17.0.1" \
    GIT_PORT="2222" \
    CONSOLE_URL="https://172.17.0.1:16643/" \
    INGRESS_IP="172.17.0.1" \
    TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjZWamZLTzEzZ2lPSGFtc0d6QXVkWXpDYi1fcmlfLWVBd3JtbEEydGItTHcifQ.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJsYWdvb24iLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlY3JldC5uYW1lIjoia3ViZXJuZXRlc2J1aWxkZGVwbG95LXRva2VuLXJxNDg1Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6Imt1YmVybmV0ZXNidWlsZGRlcGxveSIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50LnVpZCI6IjA3YzViODAxLTI5ZDgtNDU5Ni1hODBlLTZlMmU3MmY3YmMwMCIsInN1YiI6InN5c3RlbTpzZXJ2aWNlYWNjb3VudDpsYWdvb246a3ViZXJuZXRlc2J1aWxkZGVwbG95In0.srj-zZguNXCQbeTIS5GtJw7Jl61k_miC8hXED70NQULm6OAMkImHrURRCfD4kjKPy-jbwEI88m5TNLFP8_0sMfdwj2vr2Gv8fTC55qoAJ589ff_dwv8THSKdKNj6VaHynzEzQ4IfZscd3ogP4HYF9alt-X4mMcJ2BApBt4F13Hg-bE2-4uzO0b_u13pJhzn0XrH8JGXWP0_oMPtE7M0zJL9BfOrBph_MgSb2djSbVBNbhPJ0fs9-eIB5aAu0NmqPhpxj6WL4UOAKX178IsDAq4vtRZrScZwvZxRcaDUxZ-MgwewWI8Ll0yg7UCxtZTdkLglkCgpjTK33Ei0PXWdE4A"

COPY api-data /home/api-data
COPY minio-data /home/minio-data
COPY api-watch-push.sh create_jwt.py /home/

CMD ["/sbin/tini", "--", "/home/api-watch-push.sh"]
