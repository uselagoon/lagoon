FROM ubuntu:16.04

RUN apt-get update
RUN apt-get install -y openssh-server
RUN mkdir /var/run/sshd

# Disable root user login and password authentication.
RUN sed -ri 's/\#?PermitRootLogin\s+.*/PermitRootLogin no/g' /etc/ssh/sshd_config
RUN sed -ri 's/\#?ChallengeResponseAuthentication\s+.*/ChallengeResponseAuthentication no/g' /etc/ssh/sshd_config
RUN sed -ri 's/\#?PasswordAuthentication\s+.*/PasswordAuthentication no/g' /etc/ssh/sshd_config
RUN sed -ri 's/\#?UsePAM\s+.*/UsePAM no/g' /etc/ssh/sshd_config

# Use command authentication.
RUN echo '' >> /etc/ssh/sshd_config
RUN echo 'AuthorizedKeysCommand /usr/bin/authorized-keys-command.sh' >> /etc/ssh/sshd_config
RUN echo 'AuthorizedKeysCommandUser api' >> /etc/ssh/sshd_config

# Create api user for authorized keys login with bearer token script.
RUN adduser --disabled-password --gecos "" api

# This is the authorized keys command. It needs to be owned by root
# and it needs to be executable. Otherwise the daemon fails.
COPY scripts/authorized-keys-command.sh /usr/bin/authorized-keys-command.sh
RUN chmod +x /usr/bin/authorized-keys-command.sh
RUN chown root:root /usr/bin/authorized-keys-command.sh

# This is the script that is run on every ssh login attempt. It
# calls the authentication server to retrieve a token.
COPY scripts/retrieve-token.sh /home/api/retrieve-token.sh
RUN chmod +x /home/api/retrieve-token.sh
RUN chown api:api /home/api/retrieve-token.sh

EXPOSE 22

CMD ["/usr/sbin/sshd", "-D"]