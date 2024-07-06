# ライブ配信開始

おめでとうございます、あなたのウェブサイトがLagoon上でライブ配信する一歩手前に来ました！これをできるだけスムーズに進めるために、最後のチェックリストをご用意しました。これは、サイトをライブ配信する前に最後に確認すべきことをガイドします。

## `.lagoon.yml`を確認する

### ルート / SSL

あなたの`.lagoon.yml`にすべてのルートが設定されていることを確認してください。ドメインをLagoonに向けない場合、Let's Encrypt(LE)の証明書の作成を無効にすべきであることを認識しておいてください。これは問題を引き起こす可能性があります。Lagoonに向けていないドメインは、Let's Encryptの制限を超えないように、しばらくすると無効になります。

証明機関(CA)による署名付き証明書を使用する場合、`tls-acme`を`false`に設定できますが、`insecure`フラグは`Allow`または`Redirect`に設定したままにしておいてください。CA証明書の場合、Lagoonの管理者にルートと、設定する必要があるSSL証明書を知らせてください。

```yaml title=".lagoon.yml"
environments:
  main:
    routes:
      - nginx:
        - example.com:
            tls-acme: 'false'
            insecure: Allow
        - www.example.com:
            tls-acme: 'false'
            insecure: Allow
```

次に DNSエントリがあなたのLagoonインストールを指すようになると、フラグを切り替えることができます:`tls-acme` を `true` に、`insecure` を `Redirect` にします。

```yaml title=".lagoon.yml"
environments:
  main:
    routes:
      - nginx:
        - example.com:
            tls-acme: 'true'
            insecure: Redirect
        - www.example.com:
            tls-acme: 'true'
            insecure: Redirect
```

!!! Note "注意:"
    ウェブサイトのすべてのページを確認するのは少し手間がかかるかもしれませんので、[mixed-content-scan](https://github.com/bramus/mixed-content-scan)を利用することができます。これにより、サイト全体をクロールし、非HTTPSサイトからのアセットを含むページを返します。

### リダイレクト

非wwwからwwwへのリダイレクトが必要な場合は、それらが `redirects-map.conf` に設定されていることを確認してください - [ドキュメンテーションを参照](../docker-images/nginx.md#redirects-mapconf)。

### クロンジョブ

プロダクション環境用のクロンジョブが設定されているか確認してください - [`.lagoon.yml`](../concepts-basics/lagoon-yml.md)を参照してください。

## DNS

あなたのサイトが私たちのサーバーを指すようにするためにできるだけスムーズに進行するように、専用のロードバランサーDNSレコードを用意しています。これらの技術的なDNSリソースレコードは、あなたのサイトを取得するために使用されます。 amazee.ioインフラストラクチャにリンクされ、他の目的では使用されません。CNAMEレコードに疑問がある場合は、Lagoonの管理者に設定する必要がある正確なCNAMEを尋ねてください。

**amazee.ioの例:** `<region-identifier>.amazee.io`

ドメインをLagoonに切り替える前に、ライブになる前にTime-to-Live \(TTL\)を下げておくことを確認してください。これにより、古いサーバーから新しいサーバーへの切り替えが迅速に行われます。通常、DNSの切り替え前にはTTLを300-600秒に設定することをお勧めします。[TTLについての詳細情報](https://en.wikipedia.org/wiki/Time_to_live#DNS_records)。

### Fastlyのための推奨設定(CNAMEレコード):

ドメインのDNSレコードをLagoonに指す推奨方法は、以下に示すようなCNAMEレコードを使用することです:
<!-- markdown-link-check-disable-next-line -->
`CNAME`: `cdn.amazee.io`

### Fastlyのための代替設定(Aレコード):

DNSプロバイダがCNAMEレコードの使用をサポートしていない場合、代わりに以下のAレコードを使用できます。以下に示す各IPに対して個別のレコードを設定してください:

* `A`: `151.101.2.191`
* `A`: `151.101.66.191`
* `A`: `151.101.130.191`
* `A`: `151.101.194.191`

* `AAAA`: `2a04:4e42::703`
* `AAAA`: `2a04:4e42:200::703`
* `AAAA`: `2a04:4e42:400::703`
* `AAAA`: `2a04:4e42:600::703`

!!! Note "注意:"
    静的IPの設定は推奨しません DNSゾーン内のIPアドレス。Lagoonのロードバランサインフラが時間とともに変化する可能性があり、静的IPアドレスを設定するとサイトの利用可能性に影響を及ぼす可能性があります。

### ルートドメイン

ルートドメイン(例:example.com)の設定は、DNSの仕様がルートドメインをCNAMEエントリにポイントすることを許可していないため、少々トリッキーになることがあります。DNSプロバイダによっては、レコード名が異なります:

* ALIAS at [DNSimple](https://dnsimple.com/)
* ANAME at [DNS Made Easy](http://www.dnsmadeeasy.com/)
* ANAME at [easyDNS](https://www.easydns.com/)
* ALIAS at [PointDNS](https://pointhq.com/)
* CNAME at [CloudFlare](https://www.cloudflare.com/)
* CNAME at [NS1](http://ns1.com)

DNSプロバイダがルートドメイン用のIPアドレスを必要とする場合は、Lagoonの管理者に連絡してロードバランサのIPアドレスを提供してもらいます。

## 本番環境

Lagoonは開発環境と本番環境の概念を理解しています。開発環境は自動的に`noindex`と`nofollow`のヘッダーを送信し、検索エンジンによるインデックス化を禁止します。

`X-Robots-Tag: noindex, nofollow`

プロジェクトの設定中に、本番環境はすでに定義されているはずです。もしまだ定義されていない場合は、 省略された場合、あなたの環境は開発モードで動作します。Lagoonのユーザーインターフェースで環境が本番環境として設定されているかどうかを確認できます。本番環境が設定されていない場合は、Lagoonの管理者に知らせて、システムを適切に設定してもらってください。

![本番環境は左側の緑色で表示されています。](../images/lagoon-ui-production.png)
