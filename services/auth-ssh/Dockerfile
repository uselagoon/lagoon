FROM amazeeio/centos:7

RUN yum install -y openssh-server wget

# We will run the ssh daemon as 'api'.
RUN adduser api -p '*'

# Generate the ssh tokens for the 'api' user.
RUN mkdir /home/api/.ssh && \
    ssh-keygen -t rsa -f /home/api/.ssh/ssh_host_rsa_key -N '' && \
    ssh-keygen -t ecdsa -f /home/api/.ssh/ssh_host_ecdsa_key -N '' && \
    ssh-keygen -t ed25519 -f /home/api/.ssh/ssh_host_ed25519_key -N ''

# This is the script that is run on every ssh login attempt. It
# calls the authentication server to retrieve a token.
COPY services/auth-ssh/command.sh /home/api/command.sh

# Add the ssh config for the 'api' user.
COPY services/auth-ssh/sshd_config /home/api/.ssh/sshd_config

# This is the authorized keys command.
COPY services/auth-ssh/authorize.sh /usr/local/bin/authorize.sh
RUN chmod 755 /usr/local/bin/authorize.sh

# The ssh keys and the script need to be owned by the user.
RUN chown api:api /home/api -R

# Entrypoint file which will replace some environment variables into
# hardcoded values every time the container is started
COPY services/auth-ssh/docker-entrypoint.sh /amazeeio/entrypoints/99-envplate.sh

COPY .env.defaults .

EXPOSE 2020

CMD ["/usr/sbin/sshd", "-D", "-f", "/home/api/.ssh/sshd_config"]
