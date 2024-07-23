# ライブ配信開始

おめでとうございます、あなたのウェブサイトがLagoon上でライブ配信する一歩手前に来ました！これをできるだけスムーズに進めるために、最後のチェックリストをご用意しました。これは、サイトをライブ配信する前に最後に確認すべきことをガイドします。

## `.lagoon.yml`を確認する

### ルート / SSL

あなたの`.lagoon.yml`にすべてのルートが設定されていることを確認してください。ドメインをLagoonに向けない場合、Let's Encrypt(LE)の証明書の作成を無効にすべきであることを認識しておいてください。このままでは問題を引き起こす可能性があります。Lagoonに向けていないドメインは、Let's Encryptの制限を超えないようにするためしばらくすると無効になります。

証明機関(CA)による署名付き証明書を使用する場合、`tls-acme`を`false`に設定できますが、`insecure`フラグは`Allow`または`Redirect`に設定したままにしておいてください。CA証明書の場合、Lagoonの管理者にルートと設定する必要があるSSL証明書を知らせてください。

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

!!! Note "注意"
    ウェブサイトのすべてのページを確認するのは少し手間がかかるかもしれませんので、[mixed-content-scan](https://github.com/bramus/mixed-content-scan)を利用することもできます。これにより、サイト全体をクロールし、非HTTPSサイトからのアセットを含むページを返します。

### リダイレクトについて

非wwwからwwwへのリダイレクトが必要な場合は、それらが `redirects-map.conf` に設定されていることを確認してください。[ドキュメントを参照](../docker-images/nginx.md#redirects-mapconf)

### Cron jobs

production環境用のCron jobsが設定されているか確認してください。[`.lagoon.ymlのドキュメント`](../concepts-basics/lagoon-yml.md)を参照してください。

## DNS

あなたのサイトがamazee.ioのサーバーにできるだけスムーズに接続できるように、専用のロードバランサーDNSレコードを用意しています。これらの技術的なDNSリソースレコードは、あなたのサイトをamazee.ioのインフラストラクチャにリンクされるために使用され他の目的では使用されません。CNAMEレコードに疑問がある場合は、Lagoonの管理者に正確なCNAMEを設定してもらってください。

**amazee.ioの例:** `<region-identifier>.amazee.io`

ドメインをLagoonに切り替える前に、（ライブになる前に）Time-to-Live \(TTL\)を下げておくことを確認してください。これにより、古いサーバーから新しいサーバーへの切り替えが迅速に行われます。通常、DNSの切り替え前にはTTLを300-600秒に設定することをお勧めします。[TTLについての詳細情報](https://en.wikipedia.org/wiki/Time_to_live#DNS_records)

!!! Info "情報:"
    この情報はamazee.ioがホストしているプロジェクトにのみ関連しており、まもなくこのドキュメントから削除され、amazee.io固有のドキュメントに追加されます

### Fastlyの推奨設定

**サブドメイン (CNAME)**

サブドメイン(例: www.example.com.)のDNSレコードをLagoonに向けるには、以下のようにCNAMEレコードを使用することをお勧めします：
<!-- markdown-link-check-disable-next-line -->
`CNAME`: `cdn.amazee.io`

**ルートドメイン(A/AAAA)**
ルートドメイン(example.com.など)の設定は、DNS仕様ではルートドメインがCNAMEを指すことを許可していないため、厄介な場合があります。 そのため、以下のAレコードとAAAAレコードを使用する必要があります。 下記の各IPに個別のレコードを設定してください：

* `A`: `151.101.2.191`
* `A`: `151.101.66.191`
* `A`: `151.101.130.191`
* `A`: `151.101.194.191`
* `AAA`: `2a04:4e42::703`
* `AAAA`: `2a04:4e42:200::703`
* `AAAA`: `2a04:4e42:400::703`
* `AAA`: `2a04:4e42:600::703`

## 本番環境

Lagoonは開発環境と本番環境の概念を理解しています。開発環境は自動的に`noindex`と`nofollow`のヘッダーを送信し、検索エンジンによるインデックス化を禁止します。

`X-Robots-Tag: noindex, nofollow`

プロジェクトの設定中に、本番環境はすでに定義されているはずです。もしまだ定義されていない場合は、 省略された場合、あなたの環境は開発モードで動作します。Lagoonのユーザーインターフェースで環境が本番環境として設定されているかどうかを確認できます。本番環境が設定されていない場合は、Lagoonの管理者に知らせて、システムを適切に設定してもらってください。

![本番環境は左側の緑色で表示されています。](../images/lagoon-ui-production.png)
