# Lagoon Build & Deploy

This is the Image which contains the actual code that is responsible for building and deploying the Code from Git repositories.

## Main purpose
- This is the Image which contains the actual code that is responsible for building and deploying the Code from Git repositories.

## Upstream Image
- Based on the Lagoon `oc` image, which has the OpenShift Client Tools installed that are used heavily in this image.

## How this works

Everything in here is based on Bash scripts. Which in a nutshell do this:
1. Check out a given Git Repository of a given Git Reference (Branch, Branch & SHA, Tag)
2. Creates a new project in an OpenShift for the given project and branch
3. Checks yaml files (either .lagoon.yml or docker-compose.yml) to learn:
   1. Which Docker Images with which context should be built
   2. Which Services and with that which OpenShift Resources should be created
4. Builds Docker Images
5. Creates OpenShift Resources
6. Pushes Docker Images to OpenShift Registry
7. Monitors the deployment of the Resources inside OpenShift

## Environment Variables

As this is a Docker Image that is built once and then executed multiple times for each single deployment we use Environment Variables to define what should happen.

| Environment Variable | Description |
|--------|---|
| `GIT_REPO` | Full URL of Git Repo to clone/checkout, should be a ssh compatible Git Repo |
| `GIT_REF` | Git reference to checkout, can be: 1. a Git Branch prefixed by `/origin`, 2. a Git Tag, 3. a Git Sha |
| `OPENSHIFT_FOLDER` | Folder where the script should be searching for files and generally be working on, can be used to put everything in a subfolder |
| `OPENSHIFT_CONSOLE` | Full URL of the OpenShift Console where OpenShift Resources should be created in |
| `OPENSHIFT_TOKEN` | API Token of an OpenShift ServiceAccount that will be used to connect to the Console |
| `APPUIO_TOKEN` | Special case for appuio.ch (needed when is `OPENSHIFT_CONSOLE` is `https://console.appuio.ch`), the API Token that should be used to create projects with |
| `NAMESPACE` | Name of the OpenShift Project that should be used, will be created if not existing |
| `NAMESPACE_USER` | OpenShift Username that should be given access to the project (useful if the User behind `OPENSHIFT_TOKEN` is different one that will be used to access the OpenShift UI |
| `PROJECT` | Name of the Project in which this Deployment is part of |
| `BRANCH` | Branch Name in which this Deployment is part of (even though `GIT_REF` can also be a Git Hash, we still need to know which Branch do we actually deploy) |

## Mountable Volumes

In order for better working of a container created from this image, there are some Volumes that can be mounted into the Host:

| Volume Path | Description |
|--------|---|
| `/git` | Path where Git Repo will be checked out. Can be used for Caching and faster checkouts for consequent checkouts |
| `/var/run/docker.sock` | Path to the Docker Engine Socket, as we build Docker images within the Container it's good to use the Docker Engine of the Host to profit from Layer Caching etc. |


    -v $WORKSPACE:/git \\
    -v /var/run/docker.sock:/var/run/docker.sock \\
