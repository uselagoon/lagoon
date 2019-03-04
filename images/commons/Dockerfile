FROM alpine

LABEL maintainer="amazee.io"

ENV LAGOON=commons

COPY lagoon/ /lagoon/
RUN mkdir -p /lagoon/bin
COPY fix-permissions docker-sleep /bin/
COPY .bashrc /home/.bashrc

RUN apk update \
    && apk upgrade \
    && apk add --no-cache curl tini \
    && rm -rf /var/cache/apk/* \
    && curl -sLo /bin/ep https://github.com/kreuzwerker/envplate/releases/download/1.0.0-RC1/ep-linux \
    && echo "48e234e067874a57a4d4bb198b5558d483ee37bcc285287fffb3864818b42f2785be0568faacbc054e97ca1c5047ec70382e1ca0e71182c9dba06649ad83a5f6  /bin/ep" | sha512sum -c \
    && chmod +x /bin/ep \
    && curl -sLo /lagoon/bin/cron https://github.com/christophlehmann/go-crond/releases/download/0.6.1-2-g7022a21/go-crond-64-linux \
    && echo "4ecbf269a00416086a855b760b6a691d1b8a6385adb18debec893bdbebccd20822b945c476406e3ca27c784812027c23745048fadc36c4067f12038aff972dce  /lagoon/bin/cron" | sha512sum -c \
    && chmod +x /lagoon/bin/cron \
    && mkdir -p /lagoon/crontabs && fix-permissions /lagoon/crontabs \
    && ln -s /home/.bashrc /home/.profile

RUN chmod g+w /etc/passwd

ARG LAGOON_VERSION
RUN echo $LAGOON_VERSION > /lagoon/version
ENV LAGOON_VERSION=$LAGOON_VERSION

ENV TMPDIR=/tmp \
    TMP=/tmp \
    HOME=/home \
    # When Bash is invoked via `sh` it behaves like the old Bourne Shell and sources a file that is given in `ENV`
    ENV=/home/.bashrc \
    # When Bash is invoked as non-interactive (like `bash -c command`) it sources a file that is given in `BASH_ENV`
    BASH_ENV=/home/.bashrc

ENTRYPOINT ["/sbin/tini", "--", "/lagoon/entrypoints.sh"]
CMD ["/bin/docker-sleep"]