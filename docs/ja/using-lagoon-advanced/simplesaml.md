# SimpleSAML

## SimpleSAMLphp

これは、SimpleSAMLphpをプロジェクトに追加し、それをNGINX経由で提供するための設定を変更する方法の例です。

### 必要条件

SimpleSAMLphpをプロジェクトに追加します:

```bash title="Composerを使用してプロジェクトにSimpleSAMLphpを追加する"
composer req simplesamlphp/simplesamlphp
```

### SimpleSAMLphpの設定を変更する

`vendor/simplesamlphp/simplesamlphp/config-templates`から`authsources.php`と`config.php`をベンダーディレクトリ外の`conf/simplesamlphp`のような場所にコピーします。また、`vendor/simplesamlphp/simplesamlphp/metadata-templates`から`saml20-idp-remote.php`も必要です。

`config.php`で次のLagoonの値を設定します:

SimpleSAMLphpにアクセスするための基本URLパス:

```php title="config.php"
  'baseurlpath' => 'https://YOUR_DOMAIN.TLD/simplesaml/',
```

セッションをデータベースに保存する:

```php title="config.php"
  'store.type'                    => 'sql',

  'store.sql.dsn'                 => vsprintf('mysql:host=%s;port=%s;dbname=%s', [
    getenv('MARIADB_HOST'),
    getenv('MARIADB_PORT'),
    getenv('MARIADB_DATABASE'),
  ]),
```

他の設定を好みに合わせて変更します:

* ログと証明書のパスを確認します。
* SimpleSAMLphpを保護します。 ダッシュボード。
* ロギングのレベルを設定します。
* `technicalcontact`と`timezone`を設定します。

`authsources.php`にauthsources(IdPs)を追加します。例を参照してください:

```php title="authsources.php"
  'default-sp' => [
    'saml:SP',

    // このSPのエンティティID。
    'entityID' => 'https://YOUR_DOMAIN.TLD',

    // このSPが連絡すべきIdPのエンティティID。
    // NULL/未設定にすることも可能で、その場合、ユーザーには利用可能なIdPのリストが表示されます。
    'idp' => 'https://YOUR_IDP_DOMAIN.TLD',

    // ディスカバリーサービスへのURL。
    // NULL/未設定にすることも可能で、その場合、組み込みのディスカバリーサービスが使用されます。
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
        'class' => 'core ':AttributeCopy'、
        'urn:oid:2.5.4.4' => 'sn'、
      ]、
      53 => [
        'class' => 'core:AttributeCopy'、
        'urn:oid:0.9.2342.19200300.100.1.3' => 'mail'、
      ]、
    ]、
  ]、

```

`saml20-idp-remote.php`にIdPメタデータを追加します。例を参照してください:

```php title="saml20-idp-remote.php"
<?php
/**
 * SimpleSAMLphpのためのSAML 2.0 リモートIdPメタデータ。
 *
 * このファイルから使用しないIdPsを削除することを忘れないでください。
 *
 * 参照:https://simplesamlphp.org/docs/stable/simplesamlphp-reference-idp-remote
 */

/**
 * いくつかのIdP。
 */
$metadata['https://YOUR_IDP_DOMAIN.TLD'] = [
  'entityid' => 'https://YOUR_IDP_DOMAIN.TLD'、
  'name' => [
    'en' => 'Some IdP'、
  ]、
  'description' => 'Some IdP'、

  ...

];
```

ビルドプロセスで、設定ファイルをSimpleSAMLphpにコピーします:

* `vendor/simplesamlphp/simplesamlphp/config/authsources.php`
* `vendor/simplesamlphp/simplesamlphp/config/config.php`
* `vendor/simplesamlphp/simplesamlphp/metadata/saml20-idp-remote.php`

### SimpleSAMLphpのためのNGINX confを作成します

`lagoon/nginx/location_prepend_simplesamlphp.conf`というファイルを作成します:

```bash title="location_prepend_simplesamlphp.conf"
location ^~ /simplesaml {
    alias /app/vendor/simplesamlphp/simplesaml php/www;

    location ~ ^(?<prefix>/simplesaml)(?<phpfile>.+?\.php)(?<pathinfo>/.*)?$ {
        include          fastcgi_params;
        fastcgi_pass     ${NGINX_FASTCGI_PASS:-php}:9000;
        fastcgi_param    SCRIPT_FILENAME $document_root$phpfile;
        # 基本URLパスを前に付ける必要があります
        fastcgi_param    SCRIPT_NAME /simplesaml$phpfile;
        fastcgi_param    PATH_INFO $pathinfo if_not_empty;
    }
}

これにより、`/simplesaml` URLがベンダーのSimpleSAMLphpにルーティングされます。

### NGINXイメージに追加のNGINX設定を追加する

`nginx.dockerfile`を修正し、`location_prepend_simplesamlphp.conf`をイメージに追加します:

```bash title="nginx.dockerfile"
ARG CLI_IMAGE
FROM ${CLI_IMAGE} as cli

FROM amazeeio/nginx-drupal

COPY --from=cli /app /app

COPY lagoon/nginx/location_prepend_simplesamlphp.conf /etc/nginx/conf.d/drupal/location_prepend_simplesamlphp.conf
RUN fix-permissions /etc/nginx/conf.d/drupal/location_prepend_simplesamlphp.conf

# Drupal Rootの位置を定義する
ENV WEBROOT=public
```
