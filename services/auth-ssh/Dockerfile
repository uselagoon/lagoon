FROM amazeeio/centos:7

RUN yum install -y openssh-server wget

COPY sshd_config /etc/ssh/sshd_config

RUN adduser api -p '*'

RUN mkdir /var/run/sshd && \
    ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N '' && \
    ssh-keygen -t ecdsa -f /etc/ssh/ssh_host_ecdsa_key -N '' && \
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ''

COPY sshd_config /etc/ssh/sshd_config

# This is the authorized keys command.
COPY authorized-keys-command.sh /usr/bin/authorized-keys-command.sh

# This is the script that is run on every ssh login attempt. It
# calls the authentication server to retrieve a token.
COPY retrieve-token.sh /home/api/retrieve-token.sh

# entrypoint file which will replace some environment variables into
# hardcoded values every time the container is started
COPY docker-entrypoint.sh /usr/bin/docker-entrypoint

RUN fix-permissions /home/api/

EXPOSE 2020

ENTRYPOINT ["docker-entrypoint"]

CMD ["/usr/sbin/sshd", "-D"]