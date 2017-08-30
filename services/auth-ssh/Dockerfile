ARG BUILD_TAG
FROM ${BUILD_TAG:-lagoon-local-dev}/centos:7 as openssh-builder

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

FROM ${BUILD_TAG:-lagoon-local-dev}/centos:7

COPY --from=openssh-builder /home/rpmbuild/RPMS/x86_64 /home/openssh

RUN rpm -Uvh --nodeps /home/openssh/*.rpm

RUN yum install -y wget

# Generate ssh server keys
RUN mkdir .ssh && \
    ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key -N '' && \
    ssh-keygen -t ecdsa -f /etc/ssh/ssh_host_ecdsa_key -N '' && \
    ssh-keygen -t ed25519 -f /etc/ssh/ssh_host_ed25519_key -N ''

# Add the ssh config
COPY services/auth-ssh/sshd_config /etc/ssh/sshd_config

RUN fix-permissions /etc/ssh/ && \
    fix-permissions /var/run/

# This is the script that is run on every ssh login attempt. It
# calls the authentication server to retrieve a token, it is
# envplated during entrypoint so fix permissions

COPY services/auth-ssh/get-jwt-token.sh /home/get-jwt-token.sh
RUN fix-permissions /home/get-jwt-token.sh

# This is the authorized keys command, which will be defined as AuthorizedKeysCommand
COPY services/auth-ssh/authorize.sh /authorize.sh

# Files defined in AuthorizedKeysCommand need the specific permissions for
# root to own and no write permission by group or others
RUN chmod 755 /authorize.sh

# Create /authorize.env file and give api right to write it, it will be filled
# within docker-entrypoint with all environment variables and then sourced
# by /authorize.sh
RUN touch /authorize.env && fix-permissions /authorize.env

# This will set the username of the random generated user by openshift to 'api' (see 10-passwd.sh)
ENV USER_NAME api

# Entrypoint file which will replace some environment variables into
# hardcoded values every time the container is started
COPY services/auth-ssh/docker-entrypoint.sh /amazeeio/entrypoints/99-envplate.sh

# Global lagoon default environment variables
COPY .env.defaults .

EXPOSE 2020

CMD ["/usr/sbin/sshd", "-e", "-D", "-f", "/etc/ssh/sshd_config"]
