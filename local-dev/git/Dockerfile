FROM unixtastic/git-ssh-server

RUN apt-get update && apt-get install -y nginx fcgiwrap

COPY service/fcgiwrap.sh /etc/service/fcgiwrap/run
COPY service/nginx.sh /etc/service/nginx/run
COPY nginx/git /etc/nginx/sites-enabled/git
RUN rm /etc/nginx/sites-enabled/default


USER git

RUN mkdir -m 700 /git/.ssh && \
	chmod 600 /git/.ssh/authorized_keys >> /git/.ssh/authorized_keys && \
	touch /git/.hushlogin && \
	git --bare init /git/github.git && \
	git --bare init /git/gitlab.git && \
	git --bare init /git/bitbucket.git && \
	git --bare init /git/rest.git && \
	git --bare init /git/multiproject.git && \
	git --bare init /git/node.git && \
	git --bare init /git/drupal.git && \
	git --bare init /git/nginx.git && \
	git --bare init /git/features.git

USER root

COPY authorized-keys.sh /etc/my_init.d/authorized-keys.sh