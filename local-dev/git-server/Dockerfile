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
	git --bare init /git/repo.git && \
	git --bare init /git/node-multisitegroup.git && \
	git --bare init /git/node.git && \
	git --bare init /git/hiera.git

USER root

COPY authorized-keys.sh /etc/my_init.d/authorized-keys.sh
