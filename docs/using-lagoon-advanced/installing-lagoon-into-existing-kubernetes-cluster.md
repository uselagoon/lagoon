---
description: >-
  These steps will walk you through setting up Lagoon into your own existing
  Kubernetes cluster.
---

# Installing Lagoon Into Existing Kubernetes Cluster

## Requirements 

* Kubernetes 1.18+
* Familiarity with [Helm](https://helm.sh/) and [Helm Charts](https://helm.sh/docs/topics/charts/#helm), and [kubectl](https://kubernetes.io/docs/tasks/tools/).
* Ingress controller \(ingress-nginx\)
* Cert manager \(for TLS\) - We highly recommend using letsencrypt
* RWO storage

{% hint style="info" %}
We acknowledge that this is a lot of steps, and our roadmap for the immediate future includes reducing the number of steps in this process. 
{% endhint %}

## **Install Lagoon Core**

1. Add Lagoon Charts repository to your Helm: 
   1. `helm repo add lagoon https://uselagoon.github.io/lagoon-charts/`
2. Create a directory for the configuration files we will create, and make sure that it’s version controlled. Ensure that you reference this path in commands referencing your `values.yml` files. 
   1. Create `values.yml` in the directory you’ve just created. Example: [https://gist.github.com/Schnitzel/58e390bf1b6f93117a37a3eb02e8bae3](https://gist.github.com/Schnitzel/58e390bf1b6f93117a37a3eb02e8bae3) 
   2. Update the endpoint URLs \(change them from api.lagoon.example.com to your values\).
3. Now run `helm upgrade --install` command, pointing to `values.yml`, like so: ****`helm upgrade --install --create-namespace --namespace lagoon-core -f values.yml lagoon-core lagoon/lagoon-core`
4. Lagoon Core is now installed! 🎉 
5. Visit the Keycloak dashboard at the URL you defined in the `values.yml` for Keycloak.
   1. Click Administration Console
   2. Username: `admin`
   3. Password: use `lagoon-core-keycloak` secret, key-value `KEYCLOAK_ADMIN_PASSWORD`
   4. Retrieve the secret like so:`kubectl -n lagoon-core get secret lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_ADMIN_PASSWORD}" | base64 --decode`
   5. Click on **User** on top right.
      1. Go to **Manage Account.**
      2. Add an **Email** for the admin account you created.
      3. Save.
   6. Go to **Realm Lagoon** -&gt; **Realm Settings** -&gt; **Email**
      1. Configure email server for Keycloak, test connection via “Test connection” button.
   7. Go to **Realm Lagoon** -&gt; **Realm Settings** -&gt; **Login**
      1. Enable “Forgot Password”
      2. Save.
   8. You should now be able to visit the Lagoon UI at the URL you defined in the `values.yml` for the UI.
      1. Username: `lagoonadmin`
      2. Secret: use `lagoon-core-keycloak` secret key-value: `LAGOON-CORE-KEYCLOAK`
      3. Retrieve the secret: `kubectl -n lagoon-core get secret lagoon-core-keycloak -o jsonpath="{.data.KEYCLOAK_LAGOON_ADMIN_PASSWORD}" | base64 --decode`

{% hint style="warning" %}
Note: Sometimes we run into Docker Hub pull limits. We are considering moving our images elsewhere if this continues to be a problem. 
{% endhint %}

{% hint style="info" %}
Note: Currently Lagoon only supports one Lagoon per cluster - meaning you can’t currently split your dev/test/prod environments across separate clusters, but this is something we are looking to implement in the future. 
{% endhint %}

## **Install the Lagoon CLI**

1. Install the Lagoon CLI on your local machine:
   1. Check [https://github.com/amazeeio/lagoon-cli\#install](https://github.com/amazeeio/lagoon-cli#install) on how to install for your operating system. For macOS, you can use Homebrew:
      1. `brew tap amazeeio/lagoon-cli`
      2. `brew install lagoon`
2. The CLI needs to know how to communicate with Lagoon, so run the following command:

   `lagoon config add --graphql https://<YOUR-API-URL>/graphql --ui https://YOUR-UI-URL --hostname <YOUR.SSH.IP> --lagoon <YOUR-LAGOON-NAME> --port 22`

3. Access Lagoon by authenticating with your SSH key.
   1. In the Lagoon UI \(the URL is in `values.yml` if you forget\), go to **Settings**.
   2. Add your public SSH key.
   3. You need to set the default Lagoon to _your_ Lagoon so that it doesn’t try to use the amazee.io defaults:
      1.  `lagoon config default --lagoon <YOUR-LAGOON-NAME>`
4. Now run `lagoon login`
   1. How the system works: 
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
   2. Password:

      `kubectl -n harbor get secret harbor-harbor-core -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 --decode`
3. Add the above Harbor credentials to the Lagoon Core `values.yml` that you created at the beginning of the process, as well as `harbor-values.yml`. 
4. Upgrade lagoon-core release with the updated `values.yml` file: `helm upgrade --namespace lagoon-core -f values.yaml lagoon-core lagoon/lagoon-core`

{% hint style="info" %}
Note: Currently we only allow for one Harbor instance per Lagoon Core. This can be less than ideal, depending on the project, so we are currently working to implement a solution where users will be able to have a Harbor instance for each Lagoon Remote. 
{% endhint %}

## Install Lagoon Remote

Now we will install Lagoon Remote into the Lagoon namespace. The [RabbitMQ](../docker-images/rabbitmq.md) service is the broker. 

1. Create `remote-values.yml` in your config directory as you did the previous two files, and update the values. 
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
      1. In your home directory, the Lagoon CLI has created a `.lagoon.yml` file. Copy the token from that file and use it for the value here. 
   3. Save.
4. Now you’re ready to run some queries. Run the following test query to ensure everything is working correctly: 

   `query allProjects {allProjects {name } }`

5. This should give you the following response: 

   `{`

     `"data": {`

       `"allProjects": []`

     `}`

   `}`

   1. [Read more about GraphQL here in our documentation. ](graphql.md)

6. Once you get the correct response, we need to add a mutation.
   1. Run the following query:

      `mutation addKubernetes {`

        `addKubernetes(input:`

        `{`

          `name: "<TARGET-NAME-FROM-REMOTE-VALUES.yml>",`

          `consoleUrl: "<URL-OF-K8S-CLUSTER>",`

          `token: "xxxxxx”`

          `routerPattern: "${environment}.${project}.lagoon.example.com"`

        `}){id}`

      `}`

      1. consoleUrl: API Endpoint of Kubernetes Cluster
      2. token: `kubectl -n lagoon describe secret $(kubectl -n lagoon get secret | grep kubernetes-build-deploy | awk '{print $1}') | grep token: | awk '{print $2}'`

{% hint style="info" %}
Note: Authorization tokens for GraphQL are very short term so you may need to generate a new one. Run `lagoon login` and then cat the `.lagoon.yml` file to get the new token, and replace the old token in the HTTP header with the new one. 
{% endhint %}

## Add a Project

1. Run this command: `lagoon add project --gitUrl <YOUR-GITHUB-REPO-URL> --openshift 1 --productionEnvironment <YOUR-PROD-ENV> --branches <THE-BRANCHES-YOU-WANT-TO-DEPLOY> --project <YOUR-PROJECT-NAME>`
   1. The value for `--openshift` is the ID of your Kubernetes cluster.
   2. Your production environment should be the name of the branch you want to have as your production environment.
   3. The branches you want to deploy might look like this: “^\(main\|develop\)$”
   4. The name of your project is anything you want - “Company Website,” “example,” etc. 
2. Go to the Lagoon UI, and you should see your project listed!

## Add Deploy Key

Lagoon creates a deploy key for each project. You now need to add it as a deploy key in your Git repository.

1. Run the following command to get the deploy key: `lagoon get project-key --project <projectname>`
2. Copy the key and save it as a deploy key in your Git repository. 
   1. Instructions for adding a deploy key to [GitHub](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys), [GitLab](https://docs.gitlab.com/ee/user/project/deploy_keys/), [Bitbucket](https://support.atlassian.com/bitbucket-cloud/docs/add-access-keys/).

## Deploy Your Project

1. Run the following command to deploy your project: ``lagoon deploy branch -p <YOUR-PROJECT-NAME> -b <YOUR-BRANCH-NAME>```
2. Go to the Lagoon UI and take a look at your project - you should now see the environment for this project!
3. Look in your cluster at your pods list, and you should see the build pod as it begins to clone Git repositories, set up services, etc. 
   1. e.g. `kubectl get pods --all-namespaces | grep lagoon-build`

## EFS Provisioner

**This is only applicable to AWS installations.** 

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

 3. Install EFS Provisioner:`helm upgrade --install --create-namespace --namespace efs-provisioner -f efs-provisioner-values.yaml  efs-provisioner stable/efs-provisioner`

## Add Group

1. `lagoon add group -N groupname`

