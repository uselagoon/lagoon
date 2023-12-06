FROM ${UPSTREAM_REPO:-uselagoon}/commons:${UPSTREAM_TAG:-latest}

RUN apk add --no-cache \
      bash \
      fcgiwrap \
      git-daemon \
      nginx \
      openssh-server-pam \
      runit \
      spawn-fcgi

COPY service/fcgiwrap.sh /etc/service/fcgiwrap/run
COPY service/nginx.sh /etc/service/nginx/run
COPY service/sshd.sh /etc/service/sshd/run
COPY nginx/git /etc/nginx/http.d/git.conf

RUN rm /etc/nginx/http.d/default.conf && mkdir -p /run/nginx \
      && adduser --disabled-password --home /git git \
      && ssh-keygen -A \
      && sed -E -i.bak -e 's/[# ]+UsePAM.*/UsePAM yes/g' /etc/ssh/sshd_config

USER git

RUN mkdir -m 700 /git/.ssh && \
	chmod 600 /git/.ssh/authorized_keys >> /git/.ssh/authorized_keys && \
	touch /git/.hushlogin && \
	git --bare init /git/github.git && \
	git --bare init /git/gitlab.git && \
	git --bare init /git/bitbucket.git && \
	git --bare init /git/rest.git && \
	git --bare init /git/api.git && \
	git --bare init /git/multiproject.git && \
	git --bare init /git/node.git && \
	git --bare init /git/drush.git && \
	git --bare init /git/drush-sa.git && \
	git --bare init /git/nginx.git && \
	git --bare init /git/features.git && \
	git --bare init /git/features-cronjobs.git && \
	git --bare init /git/features-subfolder.git && \
	git --bare init /git/features-variables.git && \
	git --bare init /git/services.git && \
	git --bare init /git/active-standby.git && \
	git --bare init /git/python.git && \
	git --bare init /git/tasks.git && \
	git --bare init /git/image-cache.git && \
	git --bare init /git/generic.git && \
	git --bare init /git/bulk.git

USER root

COPY entrypoint.sh /usr/sbin/entrypoint.sh

ENTRYPOINT ["/sbin/tini", "--", "/usr/sbin/entrypoint.sh"]
