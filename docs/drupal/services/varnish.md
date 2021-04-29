# Varnish

We suggest using Drupal with a Varnish reverse proxy. Lagoon provides a `varnish-drupal` Docker image that has Varnish already configured with a [Drupal Varnish config](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish-drupal/drupal.vcl).

This Varnish config does the following:

* It understands Drupal session cookies and automatically disables the Varnish caching for any authenticated request.
* It automatically caches any assets \(images, css, js, etc.\) for one month, and also sends this header to the browser, so browser cache the assets as well. This happens for authenticated and non-authenticated requests.
* It has support for `BAN` and `URIBAN` which is used by the Drupal 8 purge module.
* It removes `utm_` and `gclid` from the URL parameter to prevent Google Analytics links from creating multiple cache objects.
* Many other good things - just check out the [drupal.vcl](https://github.com/uselagoon/lagoon-images/blob/main/images/varnish-drupal/drupal.vcl).

## Usage with Drupal 8

**TL;DR**: [Check out the drupal8-advanced example in our examples repo](https://github.com/uselagoon/lagoon-examples), it ships with the needed modules and needed Drupal configuration.

**Note**: many of these examples are on the same `drupal-example-simple` repo, but different branches/hashes. Be sure to get the exact branch from the examples list!

### Install Purge and Varnish Purge modules

In order to fully use Varnish with Drupal 8 cache tags, you need to install the [Purge](https://www.drupal.org/project/purge) and [Varnish Purge](https://www.drupal.org/project/varnish_purge) modules. They ship with many submodules. We suggest installing at least the following:

* `purge`
* `purge_drush`
* `purge_tokens`
* `purge_ui`
* `purge_processor_cron`
* `purge_processor_lateruntime`
* `purge_queuer_coretags`
* `varnish_purger`
* `varnish_purge_tags`

Grab them all at once:

```bash
composer require drupal/purge drupal/varnish_purge

drush en purge purge_drush purge_tokens purge_ui purge_processor_cron purge_processor_lateruntime purge_queuer_coretags varnish_purger varnish_purge_tags
```

### Configure Varnish Purge

1. Visit `Configuration > Development > Performance > Purge`.
2. Add a purger via `Add purger`.
3. Select `Varnish Bundled Purger` \(not the `Varnish Purger`, see the \#Behind the Scenes section, for more information.\).
4. Click the dropdown beside the just added purger and click `Configure`.
5. Give it a nice name, `Lagoon Varnish` sounds good.
6. Configure it with:

   ```text
    TYPE: Tag

    REQUEST:
    Hostname: varnish
    (or whatever your Varnish is called in docker-compose.yml)
    Port: 8080
    Path: /
    Request Method: BAN
    Scheme: http

    HEADERS:
    Header: Cache-Tags
    Value: [invalidations:separated_pipe]
   ```

7. `Save configuration`.

That's it! If you'd like to test this locally, make sure you read the next section.

### Configure Drupal for Varnish

There are a few other configurations that can be done:

1. Uninstall the `Internal Page Cache` Drupal module with `drush pmu page_cache`. It can cause some weird double caching situations where only the Varnish cache is cleared, but not the internal cache, and changes appear very slowly to the users. Also, it uses a lot of cache storage on big sites.
2. Change `$config['system.performance']['cache']['page']['max_age']` in `production.settings.php` to `2628000`. This tells Varnish to cache sites for up 1 month, which sounds like a lot, but the Drupal 8 cache tag system is so awesome that it will basically make sure that the Varnish cache is purged whenever something changes.

### Test Varnish Locally

Drupal setups on Lagoon locally have Varnish and the Drupal caches disabled as it can be rather hard to develop with all them set. This is done via the following:

* The `VARNISH_BYPASS=true` environment variable in `docker-compose.yml` which tells Varnish to basically disable itself.
* Drupal is configured to not send any cache headers \(via setting the Drupal config `$config['system.performance']['cache']['page']['max_age'] = 0` in `development.settings.php`\).

To test Varnish locally, change the following in `docker-compose.yml`:

* Set `VARNISH_BYPASS` to `false` in the Varnish service section.
* Set `LAGOON_ENVIRONMENT_TYPE` to `production` in the `x-environment` section.
* Run `docker-compose up -d` , which restarts all services with the new environment variables.

Now you should be able to test Varnish!

Here is a short example assuming there is a node with the ID `1` and has the URL `drupal-example.docker.amazee.io/node/1`

1. Run `curl -I drupal-example.docker.amazee.io/node/1` and look for these headers:
   * `X-LAGOON` should include `varnish` which tells you that the request actually went through Varnish.
   * `Age:` will be still `0` as Varnish has probably never seen this site before,  and the first request will warm the varnish cache.
   * `X-Varnish-Cache` will be `MISS` , also telling you that Varnish didn't find a previously cached version of this request.
2. Now run `curl -I drupal-example.docker.amazee.io/node/1` again, and the headers should be:
   * `Age:` will show you how many seconds ago the request has been cached. In our example it will probably something between 1-30, depending on how fast you are executing the command.
   * `X-Varnish-Cache` will be `HIT`, telling you that Varnish successfully found a cached version of the request and returned that one to you.
3. Change some content at `node/1` in Drupal.
4. Run `curl -I drupal-example.docker.amazee.io/node/1` , and the headers should the same as very first request:
   * `Age:0`
   * `X-Varnish-Cache: MISS`

### Varnish on Drupal behind the scenes

If you come from other Drupal hosts or have done a Drupal 8 & Varnish tutorial before, you might have realized that there are a couple of changes in the Lagoon Drupal Varnish tutorial. Let's address them:

#### Usage of `Varnish Bundled Purger` instead of `Varnish Purger`

The `Varnish Purger` purger sends a `BAN` request for each cache-tag that should be invalidated. Drupal has a lot of cache-tags, and this could lead to quite a large amount of requests sent to Varnish. `Varnish Bundled Purger` instead sends just one `BAN` request for multiple invalidations, separated nicely by pipe \(`|`\), which fits perfectly with the Varnish regular expression system of bans. This causes less requests and a smaller ban list table inside Varnish.

#### Usage of `Purge Late runtime processor`

Contradictory to the Varnish module in Drupal 7, the Drupal 8 Purge module has a slightly different approach to purging caches: It adds them to a queue which is then processed by different processors. Purge suggests using the `Cron processor` , which means that the Varnish cache is only purged during a cron run. This can lead to old data being cached by Varnish, as your cron is probably not configured to run every minute or so, and can result in confused editors and clients.

Instead, we suggest using the `Purge Late runtime processor`, which processes the queue at the end of each Drupal request. This has the advantage that if a cache-tag is added to the purge queue \(because an editor edited a Drupal node, for example\) the cache-tags for this node are directly purged. Together with the `Varnish Bundled Purger`, this means just a single additional request to Varnish at the very end of a Drupal request, which causes no noticeable processing time on the request.

#### Full support for Varnish Ban Lurker

Our Varnish configurations have full support for `Ban Lurker`. Ban Lurker helps you to maintain a clean cache and keep Varnish running smoothly. It is basically a small tool that runs through the Varnish ban list and compares them to the cached requests in the Varnish cache. Varnish bans are used to mark an object in the cache for purging. If Ban Lurker finds an item that should be "banned," it removes them from the cache and also removes the ban itself. Now any seldom-accessed objects with very long TTLs which would normally never be banned and just keep taking up cache space are removed and can be refreshed. This keeps the list of bans small and with that, less processing time for Varnish on each request. Check out the [official Varnish post on Ban Lurker](https://info.varnish-software.com/blog/ban-lurker) and some [other helpful reading](https://www.randonomicon.com/varnish/2018/09/19/banlurker.html) for more information.

### Troubleshooting

Varnish doesn't cache? Or something else not working? Here a couple of ways to debug:

* Run `drush p-debug-en` to enable debug logging of the purge module. This should show you debugging in the Drupal log under `admin/reports/dblog`.
* Make sure that Drupal sends proper cache headers. To best test this, use the URL that Lagoon generates for bypassing the Varnish cache, \(locally in our Drupal example this is [http://nginx-drupal-example.docker.amazee.io](http://nginx-drupal-example.docker.amazee.io)\). Check for the `Cache-Control: max-age=900, public` header, where the `900` is what you configured in `$config['system.performance']['cache']['page']['max_age']`.
* Make sure that the environment variable `VARNISH_BYPASS` is **not** set to `true` \(see `docker-compose.yml` and run `docker-compose up -d varnish` to make sure the environment variable is configured correctly\).
* If all fails, and before you flip your table \(╯°□°）╯︵ ┻━┻, talk to the Lagoon team, we're happy to help.

