---
description: >-
  These steps will walk you through setting up Lagoon into your own existing
  Kubernetes cluster.
---

# Installing Lagoon Into Existing Kubernetes Cluster

## Requirements&#x20;

* Kubernetes 1.18+
* Familiarity with [Helm](https://helm.sh) and [Helm Charts](https://helm.sh/docs/topics/charts/#helm), and [kubectl](https://kubernetes.io/docs/tasks/tools/).
* Ingress controller (ingress-nginx)
* Cert manager (for TLS) - We highly recommend using letsencrypt
* RWO storage

{% hint style="info" %}
We acknowledge that this is a lot of steps, and our roadmap for the immediate future includes reducing the number of steps in this process.&#x20;
{% endhint %}

## **Install Lagoon Core**

1. Add Lagoon Charts repository to your Helm:&#x20;
   1. `helm repo add lagoon https://uselagoon.github.io/lagoon-charts/`
2. Create a directory for the configuration files we will create, and make sure that it’s version controlled. Ensure that you reference this path in commands referencing your `values.yml` files.&#x20;
   1. Create `values.yml` in the directory you’ve just created. Example: [https://gist.github.com/Schnitzel/58e390bf1b6f93117a37a3eb02e8bae3](https://gist.github.com/Schnitzel/58e390bf1b6f93117a37a3eb02e8bae3)&#x20;
   2. Update the endpoint URLs (change them from api.lagoon.example.com to your values).
3. Now run `helm upgrade --install` command, pointing to `values.yml`, like so:\
   ****`helm upgrade --install --create-namespace --namespace lagoon-core -f values.yml lagoon-core lagoon/lagoon-core`
4. Lagoon Core is now installed! :tada:&#x20;
5. Visit the Keycloak dashboard at the URL you defined in the `values.yml` for Keycloak.
   1. Click Administration Console
   2. Username: `admin`
   3. Password: use `lagoon-core-keycloak` secret, key-value `KEYCLOAK_ADMIN_PASSWORD`
   4. Retrieve the secret like so:`kubectl -n lagoon-core get secret lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_ADMIN_PASSWORD}" | base64 --decode`
   5. Click on **User** on top right.
      1. Go to **Manage Account.**
      2. Add an **Email** for the admin account you created.
      3. Save.
   6. Go to **Realm Lagoon** -> **Realm Settings** -> **Email**
      1. Configure email server for Keycloak, test connection via “Test connection” button.
   7. Go to **Realm Lagoon** -> **Realm Settings** -> **Login**
      1. Enable “Forgot Password”
      2. Save.
   8. You should now be able to visit the Lagoon UI at the URL you defined in the `values.yml` for the UI.
      1. Username: `lagoonadmin`
      2. Secret: use `lagoon-core-keycloak` secret key-value: `LAGOON-CORE-KEYCLOAK`
      3. Retrieve the secret:` kubectl -n lagoon-core get secret lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_LAGOON_ADMIN_PASSWORD}" | base64 --decode`

{% hint style="warning" %}
Note: Sometimes we run into Docker Hub pull limits. We are considering moving our images elsewhere if this continues to be a problem.&#x20;
{% endhint %}

{% hint style="info" %}
Note: Currently Lagoon only supports one Lagoon per cluster - meaning you can’t currently split your dev/test/prod environments across separate clusters, but this is something we are looking to implement in the future.&#x20;
{% endhint %}

## **Install the Lagoon CLI**

1. Install the Lagoon CLI on your local machine:
   1. Check [https://github.com/amazeeio/lagoon-cli#install](https://github.com/amazeeio/lagoon-cli#install) on how to install for your operating system. For macOS, you can use Homebrew:
      1. `brew tap amazeeio/lagoon-cli`
      2. `brew install lagoon`
2.  The CLI needs to know how to communicate with Lagoon, so run the following command:

    `lagoon config add --graphql https://<YOUR-API-URL>/graphql --ui https://YOUR-UI-URL --hostname <YOUR.SSH.IP> --lagoon <YOUR-LAGOON-NAME> --port 22`
3. Access Lagoon by authenticating with your SSH key.
   1. In the Lagoon UI (the URL is in `values.yml` if you forget), go to **Settings**.
   2. Add your public SSH key.
   3. You need to set the default Lagoon to _your_ Lagoon so that it doesn’t try to use the amazee.io defaults:
      1. &#x20;`lagoon config default --lagoon <YOUR-LAGOON-NAME>`
4. Now run `lagoon login`
   1. How the system works:&#x20;
      1. Lagoon talks to SSH and authenticates against your public/private key pair, and gets a token for your username.
   2. Verify via `lagoon whoami` that you are logged in.

{% hint style="info" %}
Note: We don’t generally recommend using the Lagoon Admin role, but you’ll need to create an admin account at first to get started. Ideally, you’ll immediately create another account to work from which is _not_ an admin.
{% endhint %}

## Create Lagoon user

1. Add user via Lagoon CLI: `lagoon add user --email user@example.com --firstName MyFirstName --lastName MyLastName`
2. Go to your email and click the password reset link in the email.
3. Follow the instructions and log in to Lagoon UI with created password.
4. Add the SSH public key of the user via **Settings**.

## **Install Harbor**

1. Add Helm repo: `helm repo add harbor https://helm.goharbor.io`
2. Create the file `harbor-values.yml` inside of your config directory:

{% tabs %}
{% tab title="harbor-values.yml" %}
```yaml
expose:
  ingress:
    annotations:
      kubernetes.io/tls-acme: "true"
    hosts:
     core: harbor.lagoon.example.com
  tls:
    enabled: true
    certSource: secret
    secret:    
      secretName: harbor-harbor-ingress
externalURL: https://harbor.lagoon.example.com
harborAdminPassword: <your Harbor Admin Password>
chartmuseum:
  enabled: false
clair:
  enabled: false
notary:
  enabled: false
trivy:
  enabled: false
jobservice:
  jobLogger: stdout
registry:
  replicas: 1

```
{% endtab %}
{% endtabs %}

1. Install Harbor:`helm upgrade --install --create-namespace --namespace harbor --wait -f harbor-values.yaml --version=1.5.2 harbor harbor/harbor`
   1. We are currently using Harbor version 1.5.2. A recent update to Harbor breaks the API.
2. Visit Harbor at the URL you set in `harbor.yml`.
   1. Username: admin
   2.  Password:

       `kubectl -n harbor get secret harbor-harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode`
3. Add the above Harbor credentials to the Lagoon Core `values.yml` that you created at the beginning of the process, as well as `harbor-values.yml`.&#x20;
4. Upgrade lagoon-core release with the updated `values.yml` file: `helm upgrade --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`

## Install Lagoon Remote

Now we will install Lagoon Remote into the Lagoon namespace. The [RabbitMQ](../docker-images/rabbitmq.md) service is the broker.&#x20;

1. Create `remote-values.yml` in your config directory as you did the previous two files, and update the values.&#x20;
   1. rabbitMQPassword: `kubectl -n lagoon-core get secret lagoon-core-broker -o jsonpath="{.data.RABBITMQ_PASSWORD}" | base64 --decode`
   2. rabbitMQHostname: `lagoon-core-broker.lagoon-core.svc.local`
   3. taskSSHHost: `kubectl get service lagoon-core-broker-amqp-ext -o custom-columns="NAME:.metadata.name,IP ADDRESS:.status.loadBalancer.ingress[*].ip,HOSTNAME:.status.loadBalancer.ingress[*].hostname"`
2. Run `helm upgrade --install --create-namespace --namespace lagoon -f remote-values.yaml  lagoon-remote lagoon/lagoon-remote`

{% tabs %}
{% tab title="remote-values.yml" %}
```yaml
lagoon-build-deploy:
  enabled: true
  extraArgs:
    - "--enable-harbor=true"
    - "--harbor-url=https://harbor.lagoon.example.com"
    - "--harbor-api=https://harbor.lagoon.example.com/api/"
    - "--harbor-username=admin"
    - "--harbor-password=<HarborAdminPassword>"
  rabbitMQUsername: lagoon
  rabbitMQPassword: <from lagoon-core-broker secret>
  rabbitMQHostname: lagoon-core-broker.lagoon-core.svc.cluster.local
  lagoonTargetName: <name of lagoon remote, can be anything>
  taskSSHHost: <IP of ssh service loadbalancer>
  taskSSHPort: "22"
  taskAPIHost: "api.lagoon.example.com"
dbaas-operator:
  enabled: true
    
  mariadbProviders:
    production:
      environment: production
      hostname: 172.17.0.1.nip.io
      readReplicaHostnames:
      - 172.17.0.1.nip.io
      password: password
      port: '3306'
      user: root

    development:
      environment: development
      hostname: 172.17.0.1.nip.io
      readReplicaHostnames:
      - 172.17.0.1.nip.io
      password: password
      port: '3306'
      user: root

```
{% endtab %}
{% endtabs %}

## **Querying with GraphQL**

1. You’ll need an app for sending and receiving GraphQL queries. We recommend GraphiQL.
   1. If you’re using Homebrew, you can install it with `brew install --cask graphiql`.
2. We need to tell Lagoon Core about the Kubernetes cluster. The GraphQL endpoint is: `https://<YOUR-API-URL>/graphql`
3. Go to **Edit HTTP Headers**, and **Add Header**.
   1. Header Name: `Authorization`
   2. Value: `Bearer YOUR-TOKEN-HERE`
      1. In your home directory, the Lagoon CLI has created a `.lagoon.yml` file. Copy the token from that file and use it for the value here.&#x20;
   3. Save.
4.  Now you’re ready to run some queries. Run the following test query to ensure everything is working correctly:&#x20;

    `query allProjects {allProjects {name } }`
5.  This should give you the following response:&#x20;

    `{`

    `  "data": {`

    `    "allProjects": []`

    `  }`

    `}`

    1. [Read more about GraphQL here in our documentation. ](graphql.md)
6. Once you get the correct response, we need to add a mutation.
   1.  Run the following query:

       `mutation addKubernetes {`

       `  addKubernetes(input:`

       `  {`

       `    name: "<TARGET-NAME-FROM-REMOTE-VALUES.yml>",`

       `    consoleUrl: "<URL-OF-K8S-CLUSTER>",`

       `    token: "xxxxxx”`

       `    routerPattern: "${environment}.${project}.lagoon.example.com"`

       `  }){id}`

       `}`

       1. consoleUrl: API Endpoint of Kubernetes Cluster
       2. token: `kubectl -n lagoon describe secret $(kubectl -n lagoon get secret | grep kubernetes-build-deploy | awk '{print $1}') | grep token: | awk '{print $2}'`

{% hint style="info" %}
Note: Authorization tokens for GraphQL are very short term so you may need to generate a new one. Run `lagoon login` and then cat the `.lagoon.yml` file to get the new token, and replace the old token in the HTTP header with the new one.&#x20;
{% endhint %}

## Add a Project

1. Run this command: `lagoon add project --gitUrl <YOUR-GITHUB-REPO-URL> --openshift 1 --productionEnvironment <YOUR-PROD-ENV> --branches <THE-BRANCHES-YOU-WANT-TO-DEPLOY> --project <YOUR-PROJECT-NAME>`
   1. The value for `--openshift` is the ID of your Kubernetes cluster.
   2. Your production environment should be the name of the branch you want to have as your production environment.
   3. The branches you want to deploy might look like this: “^(main|develop)$”
   4. The name of your project is anything you want - “Company Website,” “example,” etc.&#x20;
2. Go to the Lagoon UI, and you should see your project listed!

## Add Deploy Key

Lagoon creates a deploy key for each project. You now need to add it as a deploy key in your Git repository.

1. Run the following command to get the deploy key: `lagoon get project-key --project <projectname>`
2. Copy the key and save it as a deploy key in your Git repository.&#x20;
   1. Instructions for adding a deploy key to [GitHub](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys), [GitLab](https://docs.gitlab.com/ee/user/project/deploy\_keys/), [Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/add-access-keys/).

## Deploy Your Project

1. Run the following command to deploy your project: `` lagoon deploy branch -p <YOUR-PROJECT-NAME> -b <YOUR-BRANCH-NAME>` ``
2. Go to the Lagoon UI and take a look at your project - you should now see the environment for this project!
3. Look in your cluster at your pods list, and you should see the build pod as it begins to clone Git repositories, set up services, etc.&#x20;
   1.  e.g. `kubectl get pods --all-namespaces | grep lagoon-build`



## EFS Provisioner

**This is only applicable to AWS installations. **

1. Add Helm repository: `helm repo add stable https://charts.helm.sh/stable`
2. Create `efs-provisioner-values.yml` in your config directory and update the values:

{% tabs %}
{% tab title="efs-provisioner-values.yml" %}
```yaml
efsProvisioner:
  efsFileSystemId: <efsFileSystemId>
  awsRegion: <awsRegion>
  path: /
  provisionerName: example.com/aws-efs
  storageClass:
    name: bulk
    isDefault: false
    reclaimPolicy: Delete
    mountOptions: []
global:
  deployEnv: prod

```
{% endtab %}
{% endtabs %}

&#x20;3\. Install EFS Provisioner:`helm upgrade --install --create-namespace --namespace efs-provisioner -f efs-provisioner-values.yaml  efs-provisioner stable/efs-provisioner`

## Add Group

1. `lagoon add group -N groupname`

## **Lagoon Logging**

Lagoon integrates with OpenSearch to store application, container and router logs.

Logging Overview: [**https://lucid.app/lucidchart/b1da011f-2b91-4798-9518-4164b19d327d/view**](https://lucid.app/lucidchart/b1da011f-2b91-4798-9518-4164b19d327d/view)** **

\
See also: [Logging](../logging/logging.md).

### OpenDistro

To install an OpenDistro cluster, you will need to configure TLS and secrets so that Lagoon can talk to it securely. You're going to have to create a handful of JSON files - put these in the same directory as the values files you've been creating throughout this installation process.

1. Install OpenDistro Helm, according to [https://opendistro.github.io/for-elasticsearch-docs/docs/install/helm/](https://opendistro.github.io/for-elasticsearch-docs/docs/install/helm/)&#x20;
2. Generate certificates
   1.  Install CFSSL:  [https://github.com/cloudflare/cfssl](https://github.com/cloudflare/cfssl)&#x20;

       _CFSSL is CloudFlare's PKI/TLS swiss army knife. It is both a command line tool and an HTTP API server for signing, verifying, and bundling TLS certificates. It requires Go 1.12+ to build._
   2. Generate CA. You'll need the following file:

{% tabs %}
{% tab title="ca-csr.json" %}
```yaml
{
	"CN": "ca.elasticsearch.svc.cluster.local",
	"hosts": [
    	  "ca.elasticsearch.svc.cluster.local"
	],
	"key": {
    	  "algo": "ecdsa",
    	  "size": 256
	},
	"ca": {
  	  "expiry": "87600h"
	}
}

```
{% endtab %}
{% endtabs %}

Run the following two commands:

```bash
cfssl gencert -initca ca-csr.json | cfssljson -bare ca -
rm ca.csr
```

You'll get `ca-key.pem`, and `ca.pem`. This is your CA key and self-signed certificate.

Next, we'll generate the node peering certificate. You'll need the following two files:

{% tabs %}
{% tab title="ca-config.json" %}
```yaml
	"signing": {
    	"default": {
        	"expiry": "87600h"
    	},
    	"profiles": {
        	"peer": {
            	"expiry": "87600h",
            	"usages": [
                	"signing",
                	"key encipherment",
                	"server auth",
                	"client auth"
            	]
        	},
        	"client": {
            	"expiry": "87600h",
            	"usages": [
                	"signing",
                	"key encipherment",
                	"client auth"
            	]
        	}
    	}
	}
}

```
{% endtab %}
{% endtabs %}

{% tabs %}
{% tab title="node.json" %}
```javascript
{
  "hosts": [
	"node.elasticsearch.svc.cluster.local"
  ],
  "CN": "node.elasticsearch.svc.cluster.local",
  "key": {
	"algo": "ecdsa",
	"size": 256
  }
}

```
{% endtab %}
{% endtabs %}

Run the following two commands:

```bash
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=peer node.json | cfssljson -bare node
rm node.csr
```

You'll get `node.pem` and `node-key.pem`. This is the peer certificate that will be used by nodes in the ES cluster.

Next, we'll convert the key to the format supported by Java with the following command:

`openssl pkey -in node-key.pem -out node-key.pkcs8`

Now we'll generate the admin certificate. You'll need the following file:

{% tabs %}
{% tab title="admin.json" %}
```javascript
{
  "CN": "admin.elasticsearch.svc.cluster.local",
  "key": {
	"algo": "ecdsa",
	"size": 256
  }
}

```
{% endtab %}
{% endtabs %}

Run the following two commands:

```bash
cfssl gencert -ca=ca.pem -ca-key=ca-key.pem -config=ca-config.json -profile=client admin.json | cfssljson -bare admin
rm admin.csr
```

You'll get `admin.pem` and `admin-key.pem`. This is the certificate that will be used to perform admin commands on the opendistro-security plugin.

Next, we'll convert the key to the format supported by Java with the following command:

`openssl pkey -in admin-key.pem -out admin-key.pkcs8`

**Now that we have our keys and certificates, we can continue with the installation. **

1.  Generate hashed passwords

    The `elasticsearch-secrets-values.yaml` needs two hashed passwords. Create them with this command (run it twice, enter a random password, store both the plaintext and hashed passwords).

    1. `docker run --rm -it docker.io/amazon/opendistro-for-elasticsearch:1.12.0 sh -c "chmod +x /usr/share/elasticsearch/plugins/opendistro_security/tools/hash.sh; /usr/share/elasticsearch/plugins/opendistro_security/tools/hash.sh"`
2. Create secrets:
   1. You'll need to create `elasticsearch-secrets-values.yaml`. See this gist as an example: [https://gist.github.com/Schnitzel/43f483dfe0b23ca0dddd939b12bb4b0b ](https://gist.github.com/Schnitzel/43f483dfe0b23ca0dddd939b12bb4b0b)
3. Install secrets with the following commands:
   1.  `helm repo add incubator https://charts.helm.sh/incubator`

       `helm upgrade --namespace elasticsearch --create-namespace --install elasticsearch-secrets incubator/raw --values elasticsearch-secrets-values.yaml `
4. You'll need to create `elasticsearch-values.yaml`.  See this gist as an example: (fill all <\<Placeholders>> with values) [https://gist.github.com/Schnitzel/1e386654b6abf75bf4d66a544db4aa6a](https://gist.github.com/Schnitzel/1e386654b6abf75bf4d66a544db4aa6a)&#x20;
5.  Install Elasticsearch:&#x20;

    `helm upgrade --namespace elasticsearch --create-namespace --install elasticsearch opendistro-es-X.Y.Z.tgz`

    `  --values elasticsearch-values.yaml  `
6.  Configure security inside Elasticsearch with the following:

    `kubectl exec -n elasticsearch -it elasticsearch-opendistro-es-master-0 -- bash`

    `chmod +x /usr/share/elasticsearch/plugins/opendistro_security/tools/securityadmin.sh`

    `/usr/share/elasticsearch/plugins/opendistro_security/tools/securityadmin.sh -nhnv -cacert /usr/share/elasticsearch/config/admin-root-ca.pem -cert /usr/share/elasticsearch/config/admin-crt.pem -key /usr/share/elasticsearch/config/admin-key.pem -cd /usr/share/elasticsearch/plugins/opendistro_security/securityconfig/`
7. Update `lagoon-core-values.yaml` with:

{% tabs %}
{% tab title="lagoon-core-values.yaml" %}
```yaml
elasticsearchURL: http://elasticsearch-opendistro-es-client-service.elasticsearch.svc.cluster.local:9200
kibanaURL: https://<<Kibana Public URL>>
logsDBAdminPassword: "<<PlainText Elasticsearch Admin Password>>"
```
{% endtab %}
{% endtabs %}

&#x20; 8\.  Rollout Lagoon Core:&#x20;

`helm upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`

9\. Sync all Lagoon Groups with Opendistro Elasticsearch

`kubectl -n lagoon-core exec -it deploy/lagoon-core-api -- sh`

`yarn run sync:opendistro-security`

### Logs-Concentrator

Logs-concentrator collects the logs being sent by Lagoon clusters and augments them with additional metadata before inserting them into Elasticsearch.

1. Create certificates according to ReadMe: [https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logs-concentrator)
2. Create `logs-concentrator-values.yaml` . See gist for example: [https://gist.github.com/Schnitzel/0c76bfdd2922a211aad38600485e7dc1](https://gist.github.com/Schnitzel/0c76bfdd2922a211aad38600485e7dc1)
3.  &#x20;Install logs-concentrator: `helm upgrade --install --create-namespace --namespace lagoon-logs-concentrator -f logs-concentrator-values.yaml lagoon-logs-concentrator lagoon/lagoon-logs-concentrator`



### Lagoon Logging

Lagoon Logging collects the application, router and container logs from Lagoon projects, and sends them to the logs concentrator.  It needs to be installed onto each `lagoon-remote` instance.

In addition, it should be installed in the `lagoon-core` cluster to collect logs from the `lagoon-core` service.  This is configured in the `LagoonLogs` section.

Read more about Lagoon logging here: [https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging](https://github.com/uselagoon/lagoon-charts/tree/main/charts/lagoon-logging)&#x20;

1. Create` lagoon-logging-values.yaml` . Here's an example gist: [https://gist.github.com/Schnitzel/57b6706dc32ddf9dd00e61c56d98f5cc](https://gist.github.com/Schnitzel/57b6706dc32ddf9dd00e61c56d98f5cc)&#x20;
2.  Install `lagoon-logging`:

    `helm repo add banzaicloud-stable https://kubernetes-charts.banzaicloud.com`

    ``

    `helm upgrade --install --create-namespace --namespace lagoon-logging -f lagoon-logging-values.yaml lagoon-logging lagoon/lagoon-logging`
3. If you'd like logs from `ingress-nginx` inside `lagoon-logging`:
   1. Add the content of this gist to `ingress-nginx: `[https://gist.github.com/Schnitzel/bba1a8a437f52fbf123ead1cc0406bf1](https://gist.github.com/Schnitzel/bba1a8a437f52fbf123ead1cc0406bf1)

## Lagoon Backups

Lagoon uses the k8up backup operator: [https://k8up.io](https://k8up.io). Lagoon isn’t tightly integrated with k8up, it’s more that Lagoon can create its resources in a way that k8up can automatically discover and backup.

1. Create new AWS User with policies: [https://gist.github.com/Schnitzel/1ad9761042c388a523029a2b4ff9ed75](https://gist.github.com/Schnitzel/1ad9761042c388a523029a2b4ff9ed75)&#x20;
2. Create `k8up-values.yaml`.\
   See gist example: [https://gist.github.com/Schnitzel/5b87a9e9ee7c59b2bc6b29f0f0839d56](https://gist.github.com/Schnitzel/5b87a9e9ee7c59b2bc6b29f0f0839d56)
3.  Install k8up:&#x20;

    `helm repo add appuio https://charts.appuio.ch`

    ``

    `kubectl apply -f https://github.com/vshn/k8up/releases/download/v1.1.0/k8up-crd.yaml`

    ``

    `helm upgrade --install --create-namespace --namespace k8up -f k8up-values.yaml k8up appuio/k8up`
4. Update `lagoon-core-values.yaml`:

{% tabs %}
{% tab title="lagoon-core-values.yaml" %}
```yaml
s3BAASAccessKeyID: <<Access Key ID for restore bucket>>
s3BAASSecretAccessKey: <<Access Key Secret for restore bucket>>
```
{% endtab %}
{% endtabs %}

5\. Redeploy `lagoon-core`.

## **Lagoon Files**

Lagoon files are used to store the file output of tasks, such as backups, and can be hosted on any S3-compatible storage.

1. Create new AWS User with policies** - **see example gist: [https://gist.github.com/Schnitzel/d3fa4353cb083831207494bfe1ff0151](https://gist.github.com/Schnitzel/d3fa4353cb083831207494bfe1ff0151)
2. Update `lagoon-core-values.yaml`:

{% tabs %}
{% tab title="lagoon-core-values.yaml" %}
```yaml
s3FilesAccessKeyID: <<Access Key ID>>
s3FilesBucket: <<Bucket Name for Lagoon Files>>
s3FilesHost: <<S3 endpoint like "https://s3.eu-west-1.amazonaws.com" >>
s3FilesSecretAccessKey: <<Access Key Secret>>
s3FilesRegion: <<S3 Region >>
```
{% endtab %}
{% endtabs %}

3\. If you use `ingress-nginx` in front of `lagoon-core`, we suggest setting this configuration which will allow for bigger file uploads:

{% tabs %}
{% tab title="lagoon-core-values.yaml" %}
```yaml
controller:
  config:
    client-body-timeout: '600' # max 600 secs fileuploads
    proxy-send-timeout: '1800' # max 30min connections - needed for websockets
    proxy-read-timeout: '1800' # max 30min connections - needed for websockets
    proxy-body-size: 1024m # 1GB file size
    proxy-buffer-size: 64k # bigger buffer
```
{% endtab %}
{% endtabs %}

## Gitlab

Not needed for \*most\* installs, but this is configured to integrate Lagoon with GitLab for user and group authentication.

1. [Create Personal Access token](https://docs.gitlab.com/ee/user/profile/personal\_access\_tokens.html) in GitLab for a User with Admin Access.
2. Create System Hooks under \`your-gitlab.com/admin/hooks\` pointing to: `webhookhandler.lagoon.example.com` and define a random secret token.
   1. &#x20;Enable “repository update events”
3. Update `lagoon-core-values.yaml`:

{% tabs %}
{% tab title="lagoon-core-values.yaml" %}
```yaml
api:
  additionalEnvs:
    GITLAB_API_HOST: <<URL of Gitlab example: https://your-gitlab.com>>
    GITLAB_API_TOKEN: << Personal Access token with Access to API >>
    GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
webhooks2tasks:
  additionalEnvs:
    GITLAB_API_HOST: <<URL of Gitlab example: https://your-gitlab.com>>
    GITLAB_API_TOKEN: << Personal Access token with Access to API >>
    GITLAB_SYSTEM_HOOK_TOKEN: << System Hook Secret Token >>
```
{% endtab %}
{% endtabs %}

1. Update `lagoon-core helmchart`
2. If you've already created users in Keycloak, delete them.
3. Update `lagoon-core-values.yaml`

{% tabs %}
{% tab title="lagoon-core-values.yaml" %}
```yaml
yarn sync:gitlab:all
```
{% endtab %}
{% endtabs %}

## Updating

1. Follow normal Helm Chart update procedures.
2.  Tell Helm to download newest charts:

    `helm repo update`
3. Check with `helm diff` for changes: (https://github.com/databus23/helm-diff if not installed).
   1. `helm diff upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`
4. Upgrade:
   1. `helm upgrade --install --create-namespace --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`
5. If upgrading Lagoon Core:
   1. `kubectl exec -it lagoon-core-api-db-0 sh`
   2. Run inside shell:
      1. `/rerun_initdb.sh`
6.  Check [https://github.com/uselagoon/lagoon/releases](https://github.com/uselagoon/lagoon/releases) for additional upgrades.





