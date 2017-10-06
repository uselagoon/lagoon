FROM alpine

MAINTAINER amazee.io

COPY lagoon/ /lagoon/
COPY fix-permissions docker-sleep /bin/

RUN apk update \
    && apk upgrade \
    && apk add --no-cache curl \
    && rm -rf /var/cache/apk/* \
    && curl -sLo /bin/ep https://github.com/kreuzwerker/envplate/releases/download/v0.0.8/ep-linux \
    && echo "167811f4c14976eb3468f9da1a2a153d60bb78765f4a400bb3da42be8489e21859b056305d75b90d3a2721ba686d3bb4be9fd4cba520d544412ab59634826833  /bin/ep" | sha512sum -c \
    && chmod +x /bin/ep \
    && mkdir -p /home \
    && echo "source /lagoon/entrypoints/50-dotenv.sh" > /home/.bashrc
