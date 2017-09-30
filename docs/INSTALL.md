# Install Lagoon on OpenShift

Lagoon is not only capable to deploy into OpenShift, it actually runs in OpenShift. This creates the just tiny chicken-egg problem of how to install Lagoon on an OpenShift when there is no Lagoon yet.

Luckily we can use the local development environment to kickstart another Lagoon in any OpenShift, running somewhere in the world.

This process consists of 3 main stages, which are in short:

1. Configure existing OpenShift
2. Configure and connect local Lagoon with OpenShift
3. Deploy!

### Configure existing OpenShift

In order to create resources inside OpenShift and push into the OpenShift Registry, Lagoon needs a Service Account within OpenShift \([read more about Service Accounts](https://docs.openshift.org/latest/dev_guide/service_accounts.html)\).

Technically Lagoon can use any Service Account and also needs no admin permissions, the only requirement is that the `self-provisioner` role is given to the Service Account.

In this example we create the Service Account `lagoon` in the OpenShift Project `default`.

1. Login into OpenShift as an Admin \(we assume that you have the oc cli tools already installed. If not, please see [here](https://docs.openshift.org/latest/cli_reference/get_started_cli.html#cli-reference-get-started-cli)\)

        oc login https://console-vmw-drupal.urz.uni-heidelberg.de/console/

2. Switch to the project default

        oc project default

3. Create Service Account `lagoon`.

        oc create serviceaccount lagoon

4. Describe lagoon \(we are interested in the first token\):

        oc describe serviceaccount lagoon

   example output:

        $ oc describe serviceaccount lagoon

        Name:		lagoon
        Namespace:	default
        Labels:		none;
        Annotations:	none;
        Image pull secrets:	lagoon-dockercfg-9q303

        Mountable secrets: 	lagoon-token-kvlv0
                              lagoon-dockercfg-9q303

        Tokens:            	lagoon-token-dkgwz
                              lagoon-token-kvlv0

5. Describe first token \(token are random generated, so yours will probably have another name\)

        oc describe secret lagoon-token-dkgwz

  example:

        Name:		lagoon-token-dkgwz

        Namespace:	default

        Labels:		&lt;none&gt;

        Annotations:	kubernetes.io/created-by=openshift.io/create-dockercfg-secrets
            kubernetes.io/service-account.name=lagoon
            kubernetes.io/service-account.uid=190342fc-99db-11e7-8e14-005056a1ae62

        Type:	kubernetes.io/service-account-token

        Data
        ====

        service-ca.crt:	2186 bytes

        token:		eyJhbGciOiJdfasdfNiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJkZWZhdWx0Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZWNyZXQubmFtZSI6ImxhZ29vbi10b2tlbi1kadasdfasdfasfV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VydmljZS1hY2NvdW50Lm5hbWUiOiJsYWdvb24iLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiIxOTA3NDlmYy05OWRiLTExZTctOGUxNC0wMDUwNTZhMWFlNjIiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6ZGVmYXVsdDpsYWdvb24ifQ.TD6zFNtxgSzpQV3IpF5uXDm96XWUqseMqxabPA3cLh9V5qrqoolJ73ZW3a8lx2klzTY20XDV4HpiTIMuqayjrljkc46\_JaWpkPwsDLl61jQdldVrO7PtAXZ-UD4AgDqVfchLhObDn1azlkudohYPtPvYsh8Qv8F1RPWQTpMaFywSLEza8MmrJWrnTCZ6d9V48Duzsmu5Jn2luS8NgmAN2375l5vYYD2fA4CLOUuOqBFrGjQasdfasdffq3np5ZsBMlg0piOREJEwul7hKfPxxMEblHZw7VZUvMleod9jCQmnwrrr5h8rprRV5wfHmpTFiC5JPV6UZGhA\_2gjOVw

        ca.crt:		1070 bytes

        namespace:	7 bytes

6. We are interested in the `token`, keep that for now somewhere safe.

7. Add Service Account `lagoon` to cluster role self-provisioner \(this will allow lagoon to create new projects in OpenShift\)

        oc -n default adm policy add-cluster-role-to-user self-provisioner -z lagoon
        oc -n default adm policy add-cluster-role-to-user system:build-strategy-custom -z lagoon





### Configure and connect local Lagoon with OpenShift

In order to use a local Lagoon to deploy itself on an OpenShift, we need a subset of Lagoon running locally. There are some specific make commands that build and start the needed services for you.

1. Edit `lagoon-kickstart` inside local-dev/hiera/amazeeio/sitegroups.yaml, with:
   1. `openshift.console` - The URL to the OpenShift Console, without

2. Build required Images and start services:

        make lagoon-kickstart

3.












