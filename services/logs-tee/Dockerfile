ARG ALPINE_VERSION
FROM alpine:${ALPINE_VERSION}
LABEL maintainer="support@amazee.io"

RUN addgroup -g 1000 -S socat && \
      adduser -u 1000 -S socat -G socat && \
      apk add --no-cache socat bash

COPY entrypoint.sh /

USER socat

ENTRYPOINT ["/entrypoint.sh"]
