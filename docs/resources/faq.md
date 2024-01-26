# FAQ

## How do I contact my Lagoon administrator?

You should have a private Slack channel that was set up for you to communicate - if not, or you've forgotten how to contact us, reach out at [support@amazee.io](mailto:support@amazee.io).

## I found a bug! 🐞

If you've found a bug or security issue, please send your findings to [support@amazee.io](mailto:support@amazee.io). Please DO NOT file a GitHub issue for them.

## I'm interested in amazee.io's hosting services with Lagoon

That's great news! You can contact them via email at [inquiries@amazee.io](mailto:inquiries@amazee.io).

## How can I restore a backup?

We have backups available for files and databases, typically taken every 24 hours at most. These backups are stored offsite.

We keep up to 7 daily backups and 4 weekly backups.

If you ever need to recover or restore a backup, feel free to submit a ticket or send us a message via chat and we will be more than happy to help!

## How can I download a database dump?

<iframe width="560" height="315" src="https://www.youtube.com/embed/bluTyxKqLbw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## I'm getting an invalid SSL certificate error

The first thing to try is what is listed in [our documentation about SSL](../using-lagoon-the-basics/lagoon-yml.md#ssl-configuration-tls-acme).

If you follow those steps, and you are still seeing an error, please submit a ticket or send us a message on chat and we can help resolve this for you.

## I'm getting an "Array" error when running a Drush command

This was a bug that was prevalent in Drush versions 8.1.16 and 8.1.17. There error would look something like this:

```text
The command could not be executed successfully (returned: Array [error]
(
[default] => Array
(
[default] => Array
(
[driver] => mysql
[prefix] => Array
(
[default] =>
)
, code: 0)
Error: no database record could be found for source @main [error]
```

Upgrading Drush should fix that for you. We strongly suggest that you use version 8.3 or newer. Once Drush is upgraded the command should work!

## I'm seeing an Internal Server Error when trying to access my Kibana logs

<iframe width="560" height="315" src="https://www.youtube.com/embed/BuQo5J0Qc2c" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

No need to panic! This usually happens when a tenant has not been selected. To fix this, follow these steps:

1. Go to "Tenants" on the left-hand menu of Kibana.
2. Click on your tenant name.
3. You'll see a pop-up window that says: "Tenant Change" and the name of your tenant.
4. Go back to the "Discover" tab and attempt your query again.

You should now be able to see your logs.

## I'm unable to SSH into any environment

I'm unable to SSH into any environment. I'm getting the following message: `Permission denied (publickey)`. When I run `drush sa` no aliases are returned.

This typically indicates an issue with Pygmy. You can find our troubleshooting docs for Pygmy here: [https://pygmy.readthedocs.io/en/master/troubleshooting/](https://pygmy.readthedocs.io/en/master/troubleshooting/)

## How can I check the status of a build?

<iframe width="560" height="315" src="https://www.youtube.com/embed/PyrlZqTjf68" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## How do I add a cron job?

<iframe width="560" height="315" src="https://www.youtube.com/embed/Yd_JfDyfbR0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## How do I add a new route?

<iframe width="560" height="315" src="https://www.youtube.com/embed/vQxh87F3fW4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## How do I remove a route?

You will need to contact your helpful Lagoon administrator should you need to remove a route. You can use the Slack channel that was set up for you to communicate - if not, you can always reach us at support@amazee.io or on [Discord](https://discord.gg/te5hHe95JE).

## When I run `pygmy status`, no keys are loaded

You'll need to load your SSH key into pygmy. Here's how: [https://pygmy.readthedocs.io/en/master/ssh_agent](https://pygmy.readthedocs.io/en/master/ssh_agent)

## When I run `drush sa` no aliases are returned

This typically indicates an issue with Pygmy. You can find our troubleshooting docs for Pygmy here: [https://pygmy.readthedocs.io/en/master/troubleshooting](https://pygmy.readthedocs.io/en/master/troubleshooting)

## My deployments fail with a message saying: "drush needs a more functional environment"

This usually means that there is no database uploaded to the project. [Follow our step-by-step guide to add a database to your project](../drupal/first-deployment-of-drupal.md#5-synchronize-local-database-to-the-remote-lagoon-environment).

## When I start Pygmy I see an "address already in use" error?

`Error starting userland proxy: listen tcp 0.0.0.0:80: bind: address already in use Error: failed to start containers: amazeeio-haproxy`

This is a known error! Most of the time it means that there is already something running on port 80. You can find the culprit by running the following query:

```text
netstat -ltnp | grep -w ':80'
```

That should list everything running on port 80. Kill the process running on port 80. Once port 80 is freed up, Pygmy should start up with no further errors.

## How can I change branches/PR environments/production on my project?

You can make that change using the Lagoon API! You can find the documentation for this change [in our GraphQL documentation](../administering-lagoon/graphql-queries.md#updating-objects).

## How do I add a redirect?

<iframe width="560" height="315" src="https://www.youtube.com/embed/rWb-PkRDhY4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## How can I add new users \(and SSH keys\) to my project/group?

This can be done via the Lagoon API. You can find the steps documentation for this change [in our GraphQL documentation](../administering-lagoon/graphql-queries.md#allowing-access-to-the-project).

## Can an environment be completely deleted to roll out large code changes to my project?

Environments are fully built from scratch at each deploy, dropping the old database and files and pushing your code would result in a fresh clean build, Don’t forget to re-sync!

It is possible to delete an environment via GraphQL. You can find the instructions [in our GraphQL documentation](../administering-lagoon/graphql-queries.md#deleting-environments).

## How do I get my new environment variable to show up?

Once you've added a runtime environment variable to your production environment via GraphQL, then all you need to do a deploy in order to get your change to show up on your environment.

## How do I SFTP files to/from my Lagoon environment?

For cloud hosting customers, you can SFTP to your Lagoon environment by using the following information:

* Server Hostname: `ssh.lagoon.amazeeio.cloud`
* Port: 32222
* Username: &lt;Project-Environment-Name&gt;

Your username is going to be the name of the environment you are connecting to, most commonly in the pattern _`PROJECTNAME-ENVIRONMENT`_.

You may also be interested in checking out our new Lagoon Sync tool, which you can read about here: [https://github.com/uselagoon/lagoon-sync](https://github.com/uselagoon/lagoon-sync)

Authentication also happens automatically via SSH Public & Private Key Authentication.

## I don't want to use Let's Encrypt. I have an SSL certificate I would like to install

We can definitely help with that. Once you have your own SSL certificate, feel free to submit a ticket or send us a message via chat and we will be more than happy to help! You will need to send us the following files:

* Certificate key \(.key\)
* Certificate file \(.crt\)
* Intermediate certificates \(.crt\)

Also, you will need to [set the `tls-acme` option in `.lagoon.yml` to false](../using-lagoon-the-basics/lagoon-yml.md#ssl-configuration-tls-acme).

## Is it possible to mount an external volume \(EFS/Fuse/SMB/etc\) into Lagoon?

Mounting an external volume would need to be handled completely inside of your containers, Lagoon does not provide a provision for this type of connection as part of the platform.

A developer can handle this by installing the necessary packages into the container \(via the [Dockerfile](https://docs.docker.com/engine/reference/builder/)\), and ensuring the volume mount is connected via a [pre- or post-rollout task](../using-lagoon-the-basics/lagoon-yml.md#tasks).

## Is there a way to stop a Lagoon build?

If you have a build that has been running for a long time, and want to stop it, you will need to reach out to support. Currently, builds can only be stopped by users with admin access to the cluster.

## We installed the Elasticsearch\Solr service on our website. How can we get access to the UI \(port 9200/8983\) from a browser?
<!-- markdown-link-check-disable-next-line -->
We suggest only exposing web services \(NGINX/Varnish/Node.js\) in your deployed environments. Locally, you can get the ports mapped for these services by checking `docker-compose ps`, and then load [`http://localhost`](http://localhost/)`:<port>` in your browser.

## I have a question that isn't answered here

You can reach out to the team via [Discord](https://discord.gg/te5hHe95JE) or email at [uselagoon@amazee.io](mailto:uselagoon@amazee.io).
