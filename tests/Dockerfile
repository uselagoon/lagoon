FROM alpine:3.10

RUN apk add --no-cache \
      ansible \
      bash \
      git \
      openssh-client \
      py2-jwt \
      py2-requests \
      rsync

RUN git config --global user.email "deploytest@amazee.io" && git config --global user.name deploytest

WORKDIR /ansible
COPY . /ansible

COPY hosts /etc/ansible/hosts

ENV ANSIBLE_FORCE_COLOR=true
ENV SSH_AUTH_SOCK=/tmp/ssh-agent

COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD exec /bin/bash -c "trap : TERM INT; sleep infinity & wait"
