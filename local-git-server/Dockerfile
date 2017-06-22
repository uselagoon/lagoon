FROM unixtastic/git-ssh-server

USER git

RUN mkdir /git/.ssh && \
	chmod -R 700 /git/.ssh && \
	touch /git/.ssh/authorized_keys && \
	chmod 600 /git/.ssh/authorized_keys && \
	touch /git/.hushlogin && \
	mkdir /git/repo.git && \
	cd /git/repo.git && \
	git --bare init && \
	mkdir /git/node_subfolder.git && \
	cd /git/node_subfolder.git && \
	git --bare init && \
	mkdir /git/node.git && \
	cd /git/node.git && \
	git --bare init

USER root

COPY authorized-keys.sh /etc/my_init.d/authorized-keys.sh
