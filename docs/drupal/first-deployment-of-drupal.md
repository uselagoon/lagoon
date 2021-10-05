---
description: >-
  It's time! It's time for the first deployment into Lagoon! We hope you are as
  excited as we are!
---

# First Deployment of Drupal

![excited](https://i.giphy.com/media/7kVRZwYRwF1ok/giphy-downsized.gif)

## 1. Make sure you are all set

In order to make your first deployment a successful one, please make sure that your [Drupal Project is Lagoonized](../using-lagoon-the-basics/setup_project.md) and you have set up the project in Lagoon. If not, don't worry! Follow the [Step-by-Step Guide](step-by-step-getting-drupal-ready-to-run-on-lagoon.md) which show you how this works.

## 2. Push!

With Lagoon, you create a new deployment by pushing into a branch that is configured to be deployed.

If you don't have any new code to push, don't worry, you can run

```bash
git commit --allow-empty -m "go, go! Power Rangers!"
git push
```

This will trigger a push, and the Git hosting will inform Lagoon about this push via the configured webhook.

If all is correct, you will see a notification in your configured chat system \(this is configured by your friendly Lagoon administrator\):

![Slack notification of a deployment starting.](../.gitbook/assets/first_deployment_slack_start%20%282%29%20%282%29%20%283%29%20%285%29%20%285%29%20%285%29%20%285%29.jpg)

This tells you that Lagoon has just started to deploy your code. Depending on the size of the codebase and amount of containers, this will take a couple of seconds. Just relax. If you'd like to know what's happening now, check out the [Build and Deploy Process of Lagoon](../using-lagoon-the-basics/build-and-deploy-process.md).

You can also check your Lagoon UI to see the progress of any deployment \(your Lagoon administrator has the info\).

## 3. A fail

Depending on the post-rollout tasks defined in `.lagoon.yml` , you might have run some tasks like `drush updb` or `drush cr`. These Drush tasks depend on a database existing within the environment, which obviously does not exist yet. Let's fix that! Keep reading.

## 4. Synchronize local database to the remote Lagoon environment

With full Drush site alias support in Lagoon, you can synchronize a local database with the remote Lagoon environment.

{% hint style="warning" %}
You may have to tell pygmy about your public keys before the next step.

If you get an error like `Permission denied (publickey)`, check out the documentation here: [pygmy - adding ssh keys](https://docs.lagoon.sh/pygmy/ssh-agent)
{% endhint %}

First let's make sure that you can see the Drush site aliases:

```bash
drush sa
```

This should return your just deployed environment \(let's assume you just pushed into `develop`\):

```bash
[drupal-example]cli-drupal:/app$ drush sa
@develop
@self
default
```

With this we can now synchronize the local database \(which is represented in Drush via the site alias `@self`\) with the remote one \(`@develop`\):

```bash
drush sql-sync @self @develop
```

You should see something like:

```http
[drupal-example]cli-drupal:/app$ drush sql-sync @self @develop
You will destroy data in ssh.lagoon.amazeeio.cloud/drupal and replace with data from drupal.
Do you really want to continue? (y/n): y
Starting to dump database on Source.                                                                              [ok]
Database dump saved to /home/drush-backups/drupal/20180227075813/drupal_20180227_075815.sql.gz               [success]
Starting to discover temporary files directory on Destination.                                                    [ok]
You will delete files in drupal-example-develop@ssh.lagoon.amazeeio.cloud:/tmp/drupal_20180227_075815.sql.gz and replace with data from /home/drush-backups/drupal/20180227075813/drupal_20180227_075815.sql.gz
Do you really want to continue? (y/n): y
Copying dump file from Source to Destination.                                                                     [ok]
Starting to import dump file onto Destination database.
```

Now let's try another deployment, again an empty push:

```bash
git commit --allow-empty -m "go, go! Power Rangers!"
git push
```

This time all should be green:

![Deployment Success!](../.gitbook/assets/first_deployment_slack_success%20%282%29%20%282%29%20%282%29%20%282%29%20%282%29%20%282%29%20%282%29%20%282%29.jpg)

Click on the links in the notification, and you should see your Drupal site loaded in all its beauty! It will probably not have images yet, which we will handle in [Step 6](first-deployment-of-drupal.md#6-synchronize-local-files-to-the-remote-lagoon-environment).

If it is still failing, check the logs link for more information.

## 5. Synchronize local files to the remote Lagoon environment

You probably guessed it: we can do it with Drush:

```bash
drush rsync @self:%files @develop:%files
```

It should show you something like:

```text
[drupal-example]cli-drupal:/app$ drush rsync @self:%files @develop:%files
You will delete files in drupal-example-develop@ssh.lagoon.amazeeio.cloud:/app/web/sites/default/files and replace with data from /app/web/sites/default/files/
Do you really want to continue? (y/n): y
```

In some cases, though, it might not look correct, like here:

```text
[drupal-example]cli-drupal:/app$ drush rsync @self:%files @develop:%files
You will delete files in drupal-example-develop@ssh.lagoon.amazeeio.cloud:'/app/web/%files' and replace with data from '/app/web/%files'/
Do you really want to continue? (y/n):
```

The reason for that is that the Drupal cannot resolve the path of the files directory. This most probably has to do that the Drupal is not fully configured or has a missing database. For a workaround you can use `drush rsync @self:sites/default/files @develop:sites/default/files`, but we suggest that you actually check your local and remote Drupal \(you can test with `drush status` to see if the files directory is correctly configured\).

## 6. It's done!

As soon as Lagoon is done building and deploying it will send a second notification to the chat system, like so:

![Slack notification of complete deployment.](../.gitbook/assets/first_deployment_slack_2nd_success.jpg)

This tells you:

* Which project has been deployed.
* Which branch and Git SHA has been deployed.
* A link to the full logs of the build and deployment.
* Links to all routes \(URLs\) where the environment can be reached.

That's it! We hope that wasn't too hard - making devOps accessible is what we are striving for.

## But wait, how about other branches or the production environment?

That's the beauty of Lagoon: it's exactly the same: Push the branch name you defined to be your production branch and that one will be deployed.

## Failure? Don't worry.

Did the deployment fail? Oh no! But we're here to help:

1. Click on the `logs` link in the error notification. It will tell you where in the deployment process the failure happened.
2. If you can't figure it out, ask your Lagoon administrator, they are here to help!

