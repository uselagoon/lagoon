FROM alpine

MAINTAINER amazee.io

COPY lagoon/ /lagoon/
COPY fix-permissions docker-sleep /bin/

RUN apk update \
    && apk upgrade \
    && apk add --no-cache curl \
    && rm -rf /var/cache/apk/* \
    && curl -sLo /bin/ep https://github.com/kreuzwerker/envplate/releases/download/1.0.0-RC1/ep-linux \
    && echo "48e234e067874a57a4d4bb198b5558d483ee37bcc285287fffb3864818b42f2785be0568faacbc054e97ca1c5047ec70382e1ca0e71182c9dba06649ad83a5f6  /bin/ep" | sha512sum -c \
    && chmod +x /bin/ep \
    && mkdir -p /home \
    && echo "source /lagoon/entrypoints/50-dotenv.sh" > /home/.bashrc
