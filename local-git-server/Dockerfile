FROM unixtastic/git-ssh-server

USER git

RUN mkdir -m 700 /git/.ssh && \
	chmod 600 /git/.ssh/authorized_keys >> /git/.ssh/authorized_keys && \
	touch /git/.hushlogin && \
	git --bare init /git/repo.git && \
	git --bare init /git/node_subfolder.git && \
	git --bare init /git/node.git

USER root

COPY authorized-keys.sh /etc/my_init.d/authorized-keys.sh
