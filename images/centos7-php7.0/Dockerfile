ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7

MAINTAINER amazee.io

# Install required repos, update, and then install PHP-FPM
RUN yum install -y epel-release \
        http://rpms.remirepo.net/enterprise/remi-release-7.rpm  \
        yum-utils && \
    yum-config-manager --enable remi-php70 && \
    yum install -y \
        php-bcmath \
        php-cli \
        php-fpm \
        php-mysqlnd \
        php-mssql \
        php-xml \
        php-pgsql \
        php-gd \
        php-mcrypt \
        php-ldap \
        php-imap \
        php-soap \
        php-tidy \
        php-mbstring \
        php-opcache \
        php-pdo \
        php-pecl-apcu \
        php-pecl-apcu-bc \
        php-pecl-geoip \
        php-pecl-igbinary \
        php-pecl-imagick \
        php-pecl-redis \
        unzip && \
    yum --enablerepo=epel install -y fcgi && \
    yum clean all

COPY check_fcgi /usr/sbin/
COPY docker-entrypoint /amazeeio/entrypoints/70-php-entrypoint

COPY php-fpm.conf php.ini /etc/
COPY php-fpm.d/www.conf /etc/php-fpm.d/www.conf

RUN mkdir -p /app && \
    fix-permissions /etc/php.ini && \
    fix-permissions /etc/php-fpm.conf && \
    fix-permissions /etc/php-fpm.d/ && \
    fix-permissions /run/php-fpm && \
    fix-permissions /app && \
    fix-permissions /var/lib/php/session/

EXPOSE 9000

# Run PHP-FPM on container start.
CMD ["/usr/sbin/php-fpm", "-F", "-R"]