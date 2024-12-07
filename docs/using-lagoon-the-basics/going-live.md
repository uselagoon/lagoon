# Going Live

Congratulations, you're _this_ close to going live with your website on Lagoon! In order to make this as seamless as possible, we've got this final checklist for you. It leads you through the last few things you should check before taking your site live.

## Check your `.lagoon.yml`

### Routes / SSL

Check to be sure that all routes have been set up in your `.lagoon.yml`. Be aware that if you don't point the domains towards Lagoon, you should disable Let's Encrypt (LE) certificate creation, as it will lead to issues. Domains not pointing towards Lagoon will be disabled after a while in order to not exceed the Let's Encrypt quotas.

If you use Certificate Authority (CA) signed certificates, you can set `tls-acme` to `false` , but leave the `insecure` flag set to `Allow` or `Redirect`. In the case of CA certificates, contact {{ defaults.helpstring }} with the routes and the SSL certificate that needs to be put in place.

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

As soon as the DNS entries point towards your Lagoon installation, you can switch the flags: `tls-acme` to `true` and `insecure` to `Redirect`

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

!!! Note
    As checking every page of your website might be a bit a tedious job, you can make use of [mixed-content-scan](https://github.com/bramus/mixed-content-scan). This will crawl the entire site and give you back pages that include assets from a non-HTTPS site.

### Redirects

If you need non-www to www redirects, make sure you have them set up in the `redirects-map.conf` - [see Documentation](../docker-images/nginx.md#redirects-mapconf).

### Cron jobs

Check if your cron jobs have been set up for your production environment - see [`.lagoon.yml`](../concepts-basics/lagoon-yml.md).

## DNS

You will need to update your DNS to point at your Lagoon hosting providers servers (e.g. their CDN or load balancers). Please contact {{ defaults.helpstring }} for more information.

Before you switch over your domain to Lagoon, make sure you lower the Time-to-Live (TTL) before you go live. This will ensure that the switch from the old to the new servers will go quickly. We usually advise a TTL of 300 seconds prior to the DNS switch. [More information about TTL](https://en.wikipedia.org/wiki/Time_to_live#DNS_records).

## Production environment

Lagoon understands the concept of development and production environments. Development environments automatically send `noindex` and `nofollow` headers in order to prohibit indexing by search engines.

`X-Robots-Tag: noindex, nofollow`

During project setup, the production environment should already be defined. If that's omitted, your environment will run in development mode. You can check if the environment is set as production environment in the Lagoon user interface. If the production environment is not set, let {{ defaults.helpstring }} know, and they will configure the system accordingly.

![The production environment is labelled in green on the left. ](../images/lagoon-ui-production.png)
