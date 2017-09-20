ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7
MAINTAINER amazee.io

COPY server.cnf /etc/my.cnf.d/server.cnf
COPY docker-entrypoint /amazeeio/entrypoints/70-mariadb-entrypoint

RUN yum install -y epel-release && \
    yum install -y pwgen MariaDB-server MariaDB-client && \
    yum clean all && \
    rm -rf /var/lib/mysql && \
    mkdir -p /var/lib/mysql /var/run/mysqld && \
    fix-permissions /var/lib/mysql && \
    fix-permissions /var/run/mysqld && \
    fix-permissions /var/log/ && \
    fix-permissions /etc/my.cnf.d/

### we cannot start mysql as root, we add the user mysql to the group root and change the user of the Docker Image to this user
RUN usermod -G 0 --append mysql
USER mysql

ENV MYSQL_RANDOM_ROOT_PASSWORD=true \
    MYSQL_DATABASE=amazeeio \
    MYSQL_USER=amazeeio \
    MYSQL_PASSWORD=amazeeio

VOLUME /var/lib/mysql
CMD ["mysqld"]
