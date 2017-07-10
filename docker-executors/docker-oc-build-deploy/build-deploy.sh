#!/bin/bash -xe

git-checkout-pull $GIT_REPO $GIT_REF

pushd $OPENSHIFT_FOLDER

if [ -f .amazeeio.Dockerfile ]; then
  DOCKERFILE=".amazeeio.Dockerfile"
else
  DOCKERFILE="Dockerfile"
fi

AMAZEEIO_GIT_SHA=`git rev-parse HEAD`

docker build --build-arg AMAZEEIO_GIT_SHA=$AMAZEEIO_GIT_SHA --build-arg AMAZEEIO_GIT_BRANCH=$BRANCH -t $IMAGE -f $DOCKERFILE .

# If the given OpenShift Template exists from within the Git Repo
if [ -f ".amazeeio.app.yml" ]; then
  OPENSHIFT_TEMPLATE=".amazeeio.app.yml"
# If the given OpenShift Template exists, in our template folder, we use that, if not we assume it's an URL to download from
elif [ -f "/openshift-templates/${OPENSHIFT_TEMPLATE}" ]; then
  OPENSHIFT_TEMPLATE="/openshift-templates/${OPENSHIFT_TEMPLATE}"
fi


OPENSHIFT_PROJECT=`os-project ${SITEGROUP}-${BRANCH}`

if [ "$OPENSHIFT_CONSOLE" == https://console.appuio.ch ] ; then
  APPUIO_TOKEN=2DWwgzKSdwtHS6dH4Ft30kPS32ACBytU
  CREATED=`date +%s`000
  cat appuio.json | sed "s/CREATED/$CREATED/" | sed "s/PROJECTID/$OPENSHIFT_PROJECT" | sed "s/PROJECTNAME/"${SITEGROUP} / ${BRANCH}"  | \
    curl -X POST -H "X-AccessToken: ${APPUIO_TOKEN}"   -H https://control.vshn.net/api/openshift/1/${APPUIO_ID}/projects/
else
  oc project  --insecure-skip-tls-verify $OPENSHIFT_PROJECT || oc new-project  --insecure-skip-tls-verify $OPENSHIFT_PROJECT --display-name="${SITEGROUP} / ${BRANCH}"
fi

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f ${OPENSHIFT_TEMPLATE} \
  -v TAG=${TAG} \
  -v NAME=${NAME} \
  -v SHORT_NAME=${SHORT_NAME} \
  -v SITEGROUP=${SITEGROUP} \
  -v ROUTER_URL=${OPENSHIFT_ROUTER_URL} \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

docker tag ${IMAGE} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SITEGROUP}:${TAG}
docker login -u=jenkins -p="${OPENSHIFT_TOKEN}" ${OPENSHIFT_REGISTRY}

for i in {1..2}; do docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/${SITEGROUP}:${TAG} && break || sleep 5; done

