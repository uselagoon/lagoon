# Quay

---

This document describes how to setup the [Quay](https://quay.io) Docker Repository to host Bay base images.

---





## CronJob for nightly builds


```code
$ helm install --name quay-build-builder --namespace default \
    --set ROBOT_TOKEN=XXXX \
    --set REPOSITORY=XXXX \
    --set TRIGGER_UUID=XXXX \
    charts/trigger-quay-builds/ --dry-run --debug
```



# Building quay_build image

```code
$ docker build -t desdrury/quay_build -f bay/images/Dockerfile.quay_build .

$ docker push desdrury/quay_build
```

**Testing**

```code
# Using the script directly
$ ROBOT_TOKEN=XXXX \
    REPOSITORY=XXXX \
    TRIGGER_UUID=XXXX \
    scripts/trigger_quay_builds.sh

# Using Docker
$ docker run --rm \
    --env ROBOT_TOKEN=XXXX \
    --env REPOSITORY=XXXX \
    --env TRIGGER_UUID=XXXX \
    desdrury/quay_build

# Using OpenShift 
#  > (to run a Pod)
$ oc run trigger-quay-builds \
    --rm --restart=Never --attach -it \
    --image desdrury/quay_build \
    --image-pull-policy Always \
    --command bash

#  > (To execute within the Pod)
$ ROBOT_TOKEN=XXXX \
    REPOSITORY=XXXX \
    TRIGGER_UUID=XXXX \
    ./trigger_quay_builds.sh
```


## How to get the trigger ID

```code
## List build triggers for dpc_sdp/builder
$ curl "https://quay.io/api/v1/repository/dpc_sdp/builder/trigger/?repository=dpc_sdp%2Fbuilder" \
     -H 'Authorization: Bearer <OAUTH_ACCESS_TOKEN>' \
     -H 'Content-Type: application/json'
```