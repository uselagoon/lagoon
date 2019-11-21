FROM alpine:3.10
LABEL maintainer="support@amazee.io"

RUN addgroup -g 1000 -S socat && \
      adduser -u 1000 -S socat -G socat && \
      apk add --no-cache socat bash

COPY entrypoint.sh /bin

USER socat

EXPOSE 5140

ENTRYPOINT ["entrypoint.sh"]
