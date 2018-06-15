FROM amazeeio/mariadb-drupal

USER root
COPY docker/my.cnf /etc/mysql/my.cnf
RUN fix-permissions /etc/mysql/

USER mysql
