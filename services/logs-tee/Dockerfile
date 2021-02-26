FROM alpine:3.12
LABEL maintainer="support@amazee.io"

ARG LAGOON_VERSION
ENV LAGOON_VERSION=$LAGOON_VERSION

RUN addgroup -g 1000 -S socat && \
      adduser -u 1000 -S socat -G socat && \
      apk add --no-cache socat bash

COPY entrypoint.sh /

USER socat

ENTRYPOINT ["/entrypoint.sh"]
