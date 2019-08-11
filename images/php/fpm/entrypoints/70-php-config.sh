#!/bin/sh

cp /usr/local/etc/php/conf.d/00-lagoon-php.ini.tpl /usr/local/etc/php/conf.d/00-lagoon-php.ini && ep /usr/local/etc/php/conf.d/00-lagoon-php.ini
ep /usr/local/etc/php-fpm.conf
ep /usr/local/etc/php-fpm.d/*