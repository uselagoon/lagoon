# The Lagoon Build and Deploy Process

This document describes what actually happens during a Build and Deployment, it is heavy simplified from what actually happens, but it will help you to understand what is happening under the hood every time that Lagoon deploys new code for you.

## 1. Setup OpenShift Project / Kubernetes Namespace for Environment

As first Lagoon checks if the OpenShift Project / Kubernetes Namespace for the given Environment is existing and correctly setup. It will make sure that we have the needed service accounts, create secrets and will configure environment variables into a ConfigMap `lagoon-env` which is filled with information like the environment type and name, the Lagoon project name, and so on.

## 2. Git Checkout & Merge

As next, Lagoon will checkout your code from Git. It needs that to have access to read the `.lagoon.yml` and `docker-compose.yml` but also to build the Docker Images.

Based on how the deployment has been triggered different things will happen:

#### Branch Webhook Push

If the deployment is triggered via a Webhook and is for a single Branch, Lagoon will checkout the Git SHA which is included in the Webhook. This means even if you push code to the Git Branch twice, there will be two deployments with exactly the code that was pushed, not just the newest code in the git branch.

#### Branch REST trigger

If you trigger a deployment via the REST API and do NOT define a `sha` in the POST payload, Lagoon will just checkout the branch with the newest code without a specific given Git Sha.

#### Pull Requests

If the deployment is a pull request deployment, Lagoon will load the Base and the Head Branch and SHAs for the Pull Request and will:

- checkout the base branch (the branch the Pull Request points too)
- merge the head branch (the branch that the Pull Request originates from) on top of the base branch

If the merge fails, Lagoon will also stop and inform you about this.

## 3. Build Image

For each Service defined in the `docker-compose.yml` Lagoon will check if Images need to be built or not. If they need to be built, this will happen now. The order of building is based on the order they are configured in `docker-compose.yml` and some build arguments are injected:

- `LAGOON_GIT_SHA`
- `LAGOON_GIT_BRANCH`
- `LAGOON_PROJECT`
- `LAGOON_BUILD_TYPE`  (either `pullrequest`, `branch` or `promote`)

Plus if this is a Pull Request build:

- `LAGOON_PR_HEAD_BRANCH`
- `LAGOON_PR_HEAD_SHA`
- `LAGOON_PR_BASE_BRANCH`
- `LAGOON_PR_BASE_SHA`
- `LAGOON_PR_TITLE`

Additionally for each already built image, it's name is also injected. If your docker-compose.yml defines to first build the `cli` image and then the `nginx` image, the name of the nginx image is injected as `NGINX_IMAGE`.

## 4. Configure OpenShift/Kubernetes Services and Routes

As next Lagoon will configure OpenShift/Kubernetes with all Services and Routes that are defined from the service types, plus possible additional custom routes that you have defined in `.lagoon.yml`.

In this step it will expose all defined routes in the `LAGOON_ROUTES` as comma separated URLs. It will also define one Route as the "main" route, in this order:

1. If custom routes defined: the first defined custom route in `.lagoon.yml`
2. The first auto generated one from a service defined in `docker-compose.yml`
3. None

The "main" route is injected via the `LAGOON_ROUTE` environment variable.

## 5. Push and Tag Images

Now it is time to push the previous built Docker Images into the internal Docker Image Registry.

For services that didn't define a Dockerfile to be built in `docker-compose.yml` and just gave a Image, they are tagged via `oc tag` in the OpenShift project, which will cause the internal Docker Image Registry to know about the images, so that hey can be used in containers.

## 6. Persistent Storage

Lagoon will now create persistent storage (PVC) for each service that needs and requested a persistent storage.

## 7. Cronjobs

For each service that requests a Cronjob (like the mariadb), plus for each custom cronjob defined in `.lagoon.yml` Lagoon will now generate the cronjob environment variables which are later injected into the DeploymentConfigs.

## 8. DeploymentConfigs, Statefulsets, Deamonsets

This is probably the most important step. Based on the defined service type, Lagoon will create the DeploymentConfigs, Statefulset or Daemonsets for the service.
It will include all previously gattered information like the Cronjobs, the location of persistent storage, the pushed images and so on.

Creation of these Objects will also automatically cause OpenShift/Kubernetes to trigger new deployments of the Pods if necessary, like when a environment variable has changed or an Image has changed. But if there is no change, there will be no deployment! This means if you just update the PHP code in your application, the Varnish, Solr, MariaDB, Redis and any other service that is defined but doesn not include your code will not be deployed. This makes everything much much faster.

## 9. Wait for all rollouts to be done

Now Lagoon waits, it waits for all just triggered deployments of the new pods to be finished, plus their healthchecks to be successfull.

If any of the deployments or healtchecks fails, the deployment will be stopped here and you will be informed via the defined Notification systems (like Slack) that the deployment has failed.

## 10. Run defined post-rollout tasks

Now Lagoon will check the `.lagoon.yml` file for defined tasks in `post-rollout` and will run them one by one in the defined services.

If any of them fails, Lagoon will immediatelly stop and notify you.

## 11. Success

If all went correct and nothing threw any error, Lagoon will mark this build as successfull and inform you via defined notifications.