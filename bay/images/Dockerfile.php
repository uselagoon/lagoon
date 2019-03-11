FROM amazeeio/php:7.1-fpm

# Add ClamAV.
RUN apk add --update clamav clamav-libunrar \
    && rm -rf /var/lib/clamav/daily.cvd \
    && freshclam --no-warnings || true \
    && apk del --no-cache curl \
    && apk add --no-cache "curl=7.61.1-r2" --repository http://dl-cdn.alpinelinux.org/alpine/v3.8/main/

# Add blackfire probe.
RUN version=$(php -r "echo PHP_MAJOR_VERSION.PHP_MINOR_VERSION;") \
    && mkdir -p /blackfire \
    && curl -A "Docker" -o /blackfire/blackfire-probe.tar.gz -D - -L -s https://blackfire.io/api/v1/releases/probe/php/alpine/amd64/$version \
    && tar zxpf /blackfire/blackfire-probe.tar.gz -C /blackfire \
    && mv /blackfire/blackfire-*.so $(php -r "echo ini_get('extension_dir');")/blackfire.so \
    && printf "extension=blackfire.so\nblackfire.agent_socket=tcp://blackfire:8707\n" > $PHP_INI_DIR/conf.d/blackfire.ini \
    rm -rf /blackfire

# Add common drupal config.
RUN mkdir /bay
COPY docker/services.yml /bay
COPY docker/settings.php /bay

ENV TZ=Australia/Melbourne
RUN  apk add --no-cache tzdata \
    && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone
