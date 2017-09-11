ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/centos7-php7.0-drupal

### Installing Composer and Drush
ENV COMPOSER_HOME=/composer \
    COMPOSER_ALLOW_SUPERUSER=1 \
    PATH=/composer/vendor/bin:$PATH
RUN curl -o /tmp/composer-setup.php https://getcomposer.org/installer &&  \
    curl -o /tmp/composer-setup.sig https://composer.github.io/installer.sig && \
    php -r "if (hash('SHA384', file_get_contents('/tmp/composer-setup.php')) !== trim(file_get_contents('/tmp/composer-setup.sig'))) { unlink('/tmp/composer-setup.php'); echo 'Invalid installer' . PHP_EOL; exit(1); }" && \
    php -d memory_limit=-1 /tmp/composer-setup.php --no-ansi --install-dir=/usr/local/bin --filename=composer && rm -rf /tmp/composer-setup.php && \
    composer global require drush/drush && \
    fix-permissions /composer

### Installing Drupal Console
RUN curl https://drupalconsole.com/installer -L -o /usr/local/bin/drupal  && \
    chmod +x /usr/local/bin/drupal

### Installing MariaDB MySQL Client
RUN { \
      echo '[mariadb]'; \
      echo 'name = MariaDB'; \
      echo "baseurl = http://yum.mariadb.org/10.1/centos7-amd64"; \
      echo 'gpgkey=https://yum.mariadb.org/RPM-GPG-KEY-MariaDB'; \
      echo 'gpgcheck=1'; \
    } > /etc/yum.repos.d/mariadb.repo && \
    yum install -y MariaDB-client && \
    yum clean all

### Installing GIT
RUN yum install -y https://centos7.iuscommunity.org/ius-release.rpm && \
    yum install -y git2u && \
    yum clean all

### Installing Node
RUN curl https://dl.yarnpkg.com/rpm/yarn.repo --silent -o /etc/yum.repos.d/yarn.repo && \
    curl --silent --location https://rpm.nodesource.com/setup_8.x | bash - && \
    yum install -y \
                nodejs \
                yarn \
                gcc gcc-c++ \
                file \
                openssl openssl-devel \
                && \
    yum clean all -y

COPY docker-sleep.sh /usr/local/bin/docker-sleep

WORKDIR /app

CMD ["/usr/local/bin/docker-sleep"]