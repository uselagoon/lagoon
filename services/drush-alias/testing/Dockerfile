FROM drupaldocker/drush:8-alpine

COPY local-dev/cli_id_rsa /root/.ssh/id_rsa

RUN chmod 400 /root/.ssh/id_rsa

COPY services/drush-alias/testing/entrypoint.sh /
COPY services/drush-alias/testing/aliases.drushrc.php /etc/drush/aliases.drushrc.php

ENTRYPOINT ["/entrypoint.sh"]