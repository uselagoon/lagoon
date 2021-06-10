# SimpleSAML

## SimpleSAMLphp

This is an example of how to add SimpleSAMLphp to your project and then modify configuration to serve it via NGINX.

### Requirements

Add SimpleSAMLphp to your project:

```text
$ composer req simplesamlphp/simplesamlphp
```

### Modify configuration for SimpleSAMLphp

Copy `authsources.php` and `config.php` from `vendor/simplesamlphp/simplesamlphp/config-templates` to somewhere outside vendor directory, such as `conf/simplesamlphp`. You also need `saml20-idp-remote.php` from `vendor/simplesamlphp/simplesamlphp/metadata-templates`.

In `config.php` set following values for Lagoon:

Base URL path where SimpleSAMLphp is accessed:

```text
  'baseurlpath' => 'https://YOUR_DOMAIN.TLD/simplesaml/',
```

Store sessions to database:

```text
  'store.type'                    => 'sql',

  'store.sql.dsn'                 => vsprintf('mysql:host=%s;port=%s;dbname=%s', [
    getenv('MARIADB_HOST'),
    getenv('MARIADB_PORT'),
    getenv('MARIADB_DATABASE'),
  ]),
```

Alter other settings to your liking:

* Check the paths for logs and certs.
* Secure SimpleSAMLphp dashboard
* Set up level of logging
* Set technicalcontact and timezone

Add authsources \(IdPs\) to `authsources.php`, see example:

{% tabs %}
{% tab title="authsources.php" %}
```text
  'default-sp' => [
    'saml:SP',

    // The entity ID of this SP.
    'entityID' => 'https://YOUR_DOMAIN.TLD',

    // The entity ID of the IdP this should SP should contact.
    // Can be NULL/unset, in which case the user will be shown a list of available IdPs.
    'idp' => 'https://YOUR_IDP_DOMAIN.TLD',

    // The URL to the discovery service.
    // Can be NULL/unset, in which case a builtin discovery service will be used.
    'discoURL' => null,

    'NameIDFormat' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',

    'certificate' => '/app/conf/simplesamlphp/certs/saml.crt',
    'privatekey' => '/app/conf/simplesamlphp/certs/saml.pem',
    'redirect.sign' => TRUE,
    'redirect.validate' => TRUE,

    'authproc' => [
      50 => [
        'class' => 'core:AttributeCopy',
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.6' => 'eduPersonPrincipalName',
      ],
      51 => [
        'class' => 'core:AttributeCopy',
        'urn:oid:2.5.4.42' => 'givenName',
      ],
      52 => [
        'class' => 'core:AttributeCopy',
        'urn:oid:2.5.4.4' => 'sn',
      ],
      53 => [
        'class' => 'core:AttributeCopy',
        'urn:oid:0.9.2342.19200300.100.1.3' => 'mail',
      ],
    ],
  ],
```
{% endtab %}
{% endtabs %}

Add IdP metadata to `saml20-idp-remote.php`, see example:

{% tabs %}
{% tab title="Plain Text" %}
```text
<?php
/**
 * SAML 2.0 remote IdP metadata for SimpleSAMLphp.
 *
 * Remember to remove the IdPs you don't use from this file.
 *
 * See: https://simplesamlphp.org/docs/stable/simplesamlphp-reference-idp-remote
 */

/**
 * Some IdP.
 */
$metadata['https://YOUR_IDP_DOMAIN.TLD'] = [
  'entityid' => 'https://YOUR_IDP_DOMAIN.TLD',
  'name' => [
    'en' => 'Some IdP',
  ],
  'description' => 'Some IdP',
  
  ...

];
```
{% endtab %}
{% endtabs %}

In your build process, copy config files to SimpleSAMLphp:

* `vendor/simplesamlphp/simplesamlphp/config/authsources.php`
* `vendor/simplesamlphp/simplesamlphp/config/config.php`
* `vendor/simplesamlphp/simplesamlphp/metadata/saml20-idp-remote.php`

### Create NGINX conf for SimpleSAMLphp

Create file  `lagoon/nginx/location_prepend_simplesamlphp.conf`:

{% tabs %}
{% tab title="location\_prepend\_simplesamlphp.conf" %}
```text
location ^~ /simplesaml {
    alias /app/vendor/simplesamlphp/simplesamlphp/www;

    location ~ ^(?<prefix>/simplesaml)(?<phpfile>.+?\.php)(?<pathinfo>/.*)?$ {
        include          fastcgi_params;
        fastcgi_pass     ${NGINX_FASTCGI_PASS:-php}:9000;
        fastcgi_param    SCRIPT_FILENAME $document_root$phpfile;
        # Must be prepended with the baseurlpath
        fastcgi_param    SCRIPT_NAME /simplesaml$phpfile;
        fastcgi_param    PATH_INFO $pathinfo if_not_empty;
    }
}
```
{% endtab %}
{% endtabs %}

This will route `/simplesaml` URLs to SimpleSAMLphp in vendor.

### Add additional Nginx conf to Nginx image

Modify `nginx.dockerfile` and add `location_prepend_simplesamlphp.conf` to the image:

{% tabs %}
{% tab title="nginx.dockerfile" %}
```text
ARG CLI_IMAGE
FROM ${CLI_IMAGE} as cli

FROM amazeeio/nginx-drupal

COPY --from=cli /app /app

COPY lagoon/nginx/location_prepend_simplesamlphp.conf /etc/nginx/conf.d/drupal/location_prepend_simplesamlphp.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_prepend_simplesamlphp.conf

# Define where the Drupal Root is located
ENV WEBROOT=public
```
{% endtab %}
{% endtabs %}

