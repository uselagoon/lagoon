FROM amazeeio/centos:7 as openssh-builder

RUN yum install -y rpm-build gcc make wget openssl-devel krb5-devel pam-devel libX11-devel xmkmf libXt-devel
RUN cd /usr/src && wget http://ftp.openbsd.org/pub/OpenBSD/OpenSSH/portable/openssh-7.5p1.tar.gz && tar -xvzf openssh-7.5p1.tar.gz && \
    mkdir -p /home/rpmbuild/{SOURCES,SPECS} && cp ./openssh-7.5p1/contrib/redhat/openssh.spec /home/rpmbuild/SPECS/ && \
    cp /usr/src/openssh-7.5p1.tar.gz /home/rpmbuild/SOURCES/ && \
    cd /home/rpmbuild/SPECS/ && \
    sed -i -e "s/%define no_gnome_askpass 0/%define no_gnome_askpass 1/g" openssh.spec && \
    sed -i -e "s/%define no_x11_askpass 0/%define no_x11_askpass 1/g" openssh.spec && \
    sed -i -e "s/BuildPreReq/BuildRequires/g" openssh.spec  && \
    rpmbuild -bb openssh.spec

RUN ls -l /home/rpmbuild/RPMS/x86_64/

FROM amazeeio/centos:7

COPY --from=openssh-builder /home/rpmbuild/RPMS/x86_64 /home/openssh

RUN rpm -Uvh --nodeps /home/openssh/*.rpm

RUN yum install -y wget

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
RUN chmod 750 /usr/local/bin/authorize.sh
RUN chgrp api /usr/local/bin/authorize.sh

# The ssh keys and the script need to be owned by the user.
RUN chown api:api /home/api -R

# Entrypoint file which will replace some environment variables into
# hardcoded values every time the container is started
COPY services/auth-ssh/docker-entrypoint.sh /amazeeio/entrypoints/99-envplate.sh

COPY .env.defaults .

EXPOSE 2020

CMD ["/usr/sbin/sshd", "-D", "-ddd", "-f", "/home/api/.ssh/sshd_config"]
