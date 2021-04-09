---
description: >-
  Note that as of Lagoon 1.x only OpenShift is supported to run Lagoon itself.
  Kubernetes is only supported to deploy projects and environments into.
---

# Install Lagoon 1.x on OpenShift

## Install Lagoon 1.x on OpenShift

{% hint style="warning" %}
You do not need to _install_ Lagoon locally in order to _use_ it locally! That sounds confusing, but follow the documentation. Lagoon is the system that **deploys** your local development environment to your production environment, it's **not** the environment itself. Only install Lagoon if you are interested in developing and working on it \(or if you want to do it just for fun\). You don't **need** to do it.
{% endhint %}

Lagoon is not only capable of _deploying_ into OpenShift, it actually _runs_ in OpenShift. This creates the tiny chicken and egg problem of how to install Lagoon on an OpenShift when there is no Lagoon yet. 🐣

Luckily, we can use the local development environment to kickstart another Lagoon in any OpenShift, running somewhere in the world.

Check the [OpenShift Requirements](openshift_requirements.md) before continuing.

This process consists of 4 main stages::

1. Configure existing OpenShift.
2. Configure and connect local Lagoon with OpenShift.
3. Deploy!
4. Configure Installed Lagoon.

### Configure existing OpenShift

{% hint style="info" %}
This also works with the OpenShift provided via MiniShift that can be started via `make minishift`.
{% endhint %}

In order to create resources inside OpenShift and push into the OpenShift Registry, Lagoon needs a Service Account within OpenShift \([read more about Service Accounts](https://docs.openshift.org/latest/dev_guide/service_accounts.html)\).

Technically, Lagoon can use any Service Account and also needs no admin permissions. The only requirement is that the `self-provisioner` role is given to the Service Account.

In this example we create the Service Account `lagoon` in the OpenShift Project `default`.

1. Make sure you have the `oc cli` tools already installed. If not, please see documentation [here](https://docs.openshift.org/latest/cli_reference/get_started_cli.html#cli-reference-get-started-cli).
2. Log into OpenShift as an admin:

   ```text
    oc login <openshift console>
   ```

3. Run the `openshift-lagoon-setup` script

   ```text
   make openshift-lagoon-setup
   ```

4. At the end of this script it will give you a `serviceaccount` token. Keep that somewhere safe.

### Configure and connect local Lagoon with OpenShift

In order to use a local Lagoon to deploy itself on an OpenShift, we need a subset of Lagoon running locally. We need to teach this local Lagoon how to connect to the OpenShift:

1. Edit `lagoon` inside `local-dev/api-data/01-populate-api-data.gql`, in the `Lagoon Kickstart Objects` section:
   1. `[REPLACE ME WITH OPENSHIFT URL]` - The URL to the OpenShift Console, without `console` at the end.
   2. `[REPLACE ME WITH OPENSHIFT LAGOON SERVICEACCOUNT TOKEN]` - The token of the lagoon service account that was shown to you during `make openshift-lagoon-setup`.
2. Build required images and start services:

   ```text
    make lagoon-kickstart
   ```

   This will do the following:

   1. Build all required Lagoon service images \(this can take a while\).
   2. Start all required Lagoon services.
   3. Wait 30 seconds for all services to fully start.
   4. Trigger a deployment of the `lagoon` sitegroup that you edited, which will cause your local lagoon to connect to the defined OpenShift and trigger a new deployment.
   5. Show the logs of all local Lagoon services.

3. As soon as you see messages like `Build lagoon-1 running` in the logs, it's time to connect to your OpenShift and check the build. The URL you will use for that depends on your system, but it's probably the same as in `openshift.console`.
4. Then you should see a new OpenShift Project called `[lagoon] develop` , and in there a `Build` that is running. On a local OpenShift you can find that under [https://192.168.42.100:8443/console/project/lagoon-develop/browse/builds/lagoon?tab=history](https://192.168.42.100:8443/console/project/lagoon-develop/browse/builds/lagoon?tab=history).
5. If you see the build running, check the logs and see how the deployment system does its magic! This is your very first Lagoon deployment running! 🎉 Congrats!
   1. Short background on what is actually happening here:
   2. Your local running Lagoon \(inside `docker-compose`\) received a deploy command for a project called `lagoon` that you configured.
   3. This project has defined to which OpenShift it should be deployed \(one single Lagoon can deploy into multiple OpenShifts all around the world\).
   4. The local running Lagoon service `openshiftBuildDeploy` connects to this OpenShift and creates a new project, some needed configurations \(ServiceAccounts, BuildConfigs, etc.\) and triggers a new build.
   5. This build will run and deploy another Lagoon within the OpenShift it runs.
6. As soon as the build is done, go to the `Application > Deployments` section of the OpenShift Project, and you should see all the Lagoon [DeploymentConfigs](https://docs.openshift.com/container-platform/4.4/applications/deployments/what-deployments-are.html#deployments-and-deploymentconfigs_what-deployments-are) deployed and running. Also go to `Application > Routes` and click on the generated route for `rest2tasks` \(for a local OpenShift this will be [http://rest2tasks-lagoon-develop.192.168.42.100.xip.io/](http://rest2tasks-lagoon-develop.192.168.42.100.xip.io/)\), if you get `welcome to rest2tasks` as result, you did everything correct, bravo! 🏆

### OpendistroSecurity

Once Lagoon is install operational, you need to initialize OpendistroSecurity to allow Kibana multi-tenancy. This only needs to be run once in a new setup of Lagoon.

1. Open a shell of an Elasticsearch pod in `logs-db`.
2. `run ./securityadmin_demo.sh`.

### Configure Installed Lagoon

We have a fully running Lagoon. Now it's time to configure the first project inside of it. Follow the examples in [GraphQL API](../../administering-lagoon/graphql-queries.md).

