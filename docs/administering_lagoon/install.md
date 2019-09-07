# Install Lagoon on OpenShift

Lagoon is not only capable to deploy into OpenShift, it actually runs in OpenShift. This creates the just tiny chicken-egg problem of how to install Lagoon on an OpenShift when there is no Lagoon yet.

Luckily we can use the local development environment to kickstart another Lagoon in any OpenShift, running somewhere in the world.

Check the [Requirements for OpenShift by Lagoon](/administering_lagoon/openshift_requirements.md) before continuing.

This process consists of 3 main stages, which are in short:

1. Configure existing OpenShift
2. Configure and connect local Lagoon with OpenShift
3. Deploy!
4. Configure Installed Lagoon

### Configure existing OpenShift

Hint: This also works with the OpenShift provided via MiniShift that can be started via `make openshift`.

In order to create resources inside OpenShift and push into the OpenShift Registry, Lagoon needs a Service Account within OpenShift \([read more about Service Accounts](https://docs.openshift.org/latest/dev_guide/service_accounts.html)\).

Technically Lagoon can use any Service Account and also needs no admin permissions, the only requirement is that the `self-provisioner` role is given to the Service Account.

In this example we create the Service Account `lagoon` in the OpenShift Project `default`.

1.  Login into OpenShift as an Admin \(we assume that you have the oc cli tools already installed. If not, please see [here](https://docs.openshift.org/latest/cli_reference/get_started_cli.html#cli-reference-get-started-cli)\)

        oc login <openshift console>

2.  Run the openshift-lagoon-setup script

        make openshift-lagoon-setup

3.  At the end of this script it will give you a serviceaccount token, keep that somewhere safe.

### Configure and connect local Lagoon with OpenShift

In order to use a local Lagoon to deploy itself on an OpenShift, we need a subset of Lagoon running locally. We need to tech this local Lagoon how to connect to the OpenShift:

1.  Edit `lagoon` inside local-dev/api-data/01-populate-api-data.gql, in the `Lagoon Kickstart Objects` section:

    1. `[REPLACE ME WITH OPENSHIFT URL]` - The URL to the OpenShift Console, without `console` at the end.
    2. `[REPLACE ME WITH OPENSHIFT LAGOON SERVICEACCOUTN TOKEN]` - The token of the lagoon service account that was shown to you during `make openshift-lagoon-setup`

2.  Build required Images and start services:

         make lagoon-kickstart

    This will do the following:

    1. Build all required Lagoon service Images (this can take a while)
    2. Start all required Lagoon services
    3. Wait 30 secs for all services to fully start
    4. Trigger a deployment of the `lagoon` sitegroup that you edited further, which will cause your local lagoon to connect to the defined OpenShift and trigger a new deployment
    5. Show the logs of all Local Lagoon Services

3.  As soon as you see messages like `Build lagoon-1 running` in the logs it's time to connect to your OpenShift and check the build. The URL you will use for that depends on your system, but it's most probably the same as in `openshift.console`. Then you should see a new OpenShift Project called `[lagoon] develop` and in there a `Build` that is running. On a local OpenShift you can find that under https://192.168.99.100:8443/console/project/lagoon-develop/browse/builds/lagoon?tab=history. If you see the Build running check the logs and see how the deployment system does it's magic! This is your very first Lagoon deployment running! 🎉 Congrats!

    Short background on what is actually happening here:

    Your local running Lagoon (inside docker-compose) received a deploy command for a project called `lagoon` that you configured. In this project it is defined to which OpenShift that should be deployed (one single Lagoon can deploy into multiple OpenShifts all around the world). So the local running Lagoon service `openshiftBuildDeploy` connects to this OpenShift and creates a new project, some needed configurations (ServiceAccounts, BuildConfigs, etc.) and triggers a new Build. This Build will run and deploy another Lagoon within the OpenShift it runs.

4.  As soon as the build is done, go to the `Application > Deployments` section of the OpenShift Project and you should see all the Lagoon Deployment Configs deployed and running. Also go to `Application > Routes` and click on the generated route for `rest2tasks` (for a local OpenShift this will be http://rest2tasks-lagoon-develop.192.168.99.100.xip.io/), if you get `welcome to rest2tasks` as result, you did everything correct, bravo!

### OpendistroSecurity

Once Lagoon is install operational you need to initialise OpendistroSecurity to allow Kibana multitenancy. This only needs to be run once in a new setup of lagoon.

1. Open a shell of an elasticsearch pod in logs-db.
2. run ./securityadmin_demo.sh

### Configure Installed Lagoon

We have now a fully running Lagoon. Now it's time to configure the first project inside of it. Follow the examples in [GraphQL API](/administering_lagoon/graphql_api.md)
