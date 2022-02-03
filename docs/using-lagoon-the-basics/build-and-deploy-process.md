# Build and Deploy Process

This document describes what actually happens during a Lagoon build and deployment. It is heavily simplified from what actually happens, but it will help you to understand what is happening under the hood every time that Lagoon deploys new code for you.

Watch the video below for a walk-through of the deployment process.

<iframe width="560" height="315" src="https://www.youtube.com/embed/XiaH7gqUXWc" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## 1. Set up OpenShift Project/Kubernetes Namespace for Environment

First, Lagoon checks if the OpenShift project/Kubernetes namespace for the given environment exists and is correctly set up. It will make sure that we have the needed service accounts, create secrets, and will configure environment variables into a ConfigMap `lagoon-env` which is filled with information like the environment type and name, the Lagoon project name, and so on.

## 2. Git Checkout & Merge

Next, Lagoon will check out your code from Git. It needs that to be able to read the `.lagoon.yml` ,`docker-compose.yml` and any `.env` files, but also to build the Docker images.

Note that Lagoon will only process these actions if the branch/PR matches the branch regex set in Lagoon. Based on how the deployment has been triggered, different things will happen:

### **Branch Webhook Push**

If the deployment is triggered automatically via a Git webhook and is for a single branch, Lagoon will check out the Git SHA which is included in the webhook payload. This will trigger a deployment for every Git SHA pushed.

### **Branch REST trigger**

If you trigger a branch deployment manually via the REST API \(via the UI, or GraphQL\) and do NOT define a `SHA` in the POST payload, Lagoon will just check out the latest commit in that branch and deploy it.

### **Pull Requests**

If the deployment is a pull request \(PR\) deployment, Lagoon will load the base and the HEAD branch and SHAs for the pull request and will:

* Check out the base branch \(the branch the PR points to\).
* Merge the `HEAD` branch \(the branch that the PR originates from\) on top of the base branch.
* **More specifically:**
  * Lagoon will check out and merge particular SHAs which were sent in the webhook. Those SHAs may or _may not_ point to the branch heads. For example, if you make a new push to a GitHub pull request, it can happen that SHA of the base branch will _not_ point to the current base branch HEAD.

If the merge fails, Lagoon will also stop and inform you about this.

## 3. Build Image

For each service defined in the `docker-compose.yml` Lagoon will check if images need to be built or not. If they need to be built, this will happen now. The order of building is based on the order they are configured in `docker-compose.yml` , and some build arguments are injected:

* `LAGOON_GIT_SHA`
* `LAGOON_GIT_BRANCH`
* `LAGOON_PROJECT`
* `LAGOON_BUILD_TYPE` \(either `pullrequest`, `branch` or `promote`\)
* `LAGOON_SSH_PRIVATE_KEY` - The SSH private key that is used to clone the source repository. Use `RUN /lagoon/entrypoints/05-ssh-key.sh` to convert the build argument into an actual key at `/home/.ssh/key` which will be used by SSH and Git automatically. For safety, remove the key again via `RUN rm /home/.ssh/key`.
* `LAGOON_GIT_SOURCE_REPOSITORY` - The full Git URL of the source repository.

Also, if this is a pull request build:

* `LAGOON_PR_HEAD_BRANCH`
* `LAGOON_PR_HEAD_SHA`
* `LAGOON_PR_BASE_BRANCH`
* `LAGOON_PR_BASE_SHA`
* `LAGOON_PR_TITLE`

Additionally, for each already built image, its name is also injected. If your `docker-compose.yml` is configured to first build the `cli` image and then the `nginx` image, the name of the `nginx` image is injected as `NGINX_IMAGE`.

## 4. Configure OpenShift/Kubernetes Services and Routes

Next, Lagoon will configure OpenShift/Kubernetes with all services and routes that are defined from the service types, plus possible additional custom routes that you have defined in `.lagoon.yml`.

In this step it will expose all defined routes in the `LAGOON_ROUTES` as comma separated URLs. It will also define one route as the "main" route, in this order:

1. If custom routes defined: the first defined custom route in `.lagoon.yml`.
2. The first auto-generated route from a service defined in `docker-compose.yml`.
3. None.

The "main" route is injected via the `LAGOON_ROUTE` environment variable.

## 5. Push and Tag Images

Now it is time to push the previously built Docker images into the internal Docker image registry.

For services that didn't specify a Dockerfile to be built in `docker-compose.yml` and only gave an image, they are also tagged and will cause the internal Docker image registry to know about the images, so that they can be used in containers.

## 6. Persistent Storage

Lagoon will now create persistent storage \(PVC\) for each service that needs and requested persistent storage.

## 7. Cron jobs

For each service that requests a cron job \(like MariaDB\), plus for each custom cron job defined in `.lagoon.yml,` Lagoon will now generate the cron job environment variables which are later injected into the [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/).

## 8. Run defined pre-rollout tasks

Now Lagoon will check the `.lagoon.yml` file for defined tasks in `pre-rollout` and will run them one by one in the defined services. Note that these tasks are executed on the pods currently running \(so cannot utilize features or scripts that only exist in the latest commit\) and therefore they are also not run on first deployments.

If any of them fail, Lagoon will immediately stop and notify you, and the rollout will not proceed.

## 9. DeploymentConfigs, Statefulsets, Daemonsets

This is probably the most important step. Based on the defined service type, Lagoon will create the [Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [Statefulset](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) or [Daemonsets](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) for the service. \(Note that Deployments are analogous to [DeploymentConfigs](https://docs.openshift.com/container-platform/latest/applications/deployments/what-deployments-are.html) in OpenShift\)

It will include all previously gathered information like the cron jobs, the location of persistent storage, the pushed images and so on.

Creation of these objects will also automatically cause OpenShift/Kubernetes to trigger new deployments of the pods if necessary, like when an environment variable has changed or an image has changed. But if there is no change, there will be no deployment! This means if you only update the PHP code in your application, the Varnish, Solr, MariaDB, Redis and any other service that is defined but does not include your code will not be deployed. This makes everything much much faster.

## 10. Wait for all rollouts to be done

Now Lagoon waits! It waits for all of the just-triggered deployments of the new pods to be finished, as well as for their health checks to be successful.

If any of the deployments or health checks fail, the deployment will be stopped here, and you will be informed via the defined notification systems \(like Slack\) that the deployment has failed.

## 11. Run defined post-rollout tasks

Now Lagoon will check the `.lagoon.yml` file for defined tasks in `post-rollout` and will run them one by one in the defined services.

If any of them fail, Lagoon will immediately stop and notify you.

## 12. Success

If all went well and nothing threw any errors, Lagoon will mark this build as successful and inform you via defined notifications. ✅
