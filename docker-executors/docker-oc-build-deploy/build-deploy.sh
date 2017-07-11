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


if [ "$OPENSHIFT_CONSOLE" == https://console.appuio.ch ] ; then
  OPENSHIFT_PROJECT="amze-${OPENSHIFT_PROJECT}"
  CREATED=`date +%s`000
  APPUIO_ID="appuio public"

  # check first if the project exists, if not try to create it
  curl -f -H "X-AccessToken: ${APPUIO_TOKEN}" "https://control.vshn.net/api/openshift/1/${APPUIO_ID}/projects/${OPENSHIFT_PROJECT}" || \
  cat appuio.json | sed "s/CREATED/$CREATED/" | sed "s/PROJECTID/$OPENSHIFT_PROJECT/" | sed "s/PROJECTNAME/${SITEGROUP} - ${BRANCH}/"  | \
    curl -d @- -X POST -H "X-AccessToken: ${APPUIO_TOKEN}" "https://control.vshn.net/api/openshift/1/${APPUIO_ID}/projects/"
else
  oc project  --insecure-skip-tls-verify $OPENSHIFT_PROJECT || oc new-project  --insecure-skip-tls-verify $OPENSHIFT_PROJECT --display-name="[${SITEGROUP}] ${BRANCH}"
fi

oc process --insecure-skip-tls-verify \
  -n ${OPENSHIFT_PROJECT} \
  -f ${OPENSHIFT_TEMPLATE} \
  -v BRANCH=${SAFE_BRANCH} \
  -v SITEGROUP=${SAFE_SITEGROUP} \
  -v ROUTER_URL=${OPENSHIFT_ROUTER_URL} \
  | oc apply --insecure-skip-tls-verify -n ${OPENSHIFT_PROJECT} -f -

docker tag ${IMAGE} ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/app:latest
docker login -u=jenkins -p="${OPENSHIFT_TOKEN}" ${OPENSHIFT_REGISTRY}

for i in {1..2}; do docker push ${OPENSHIFT_REGISTRY}/${OPENSHIFT_PROJECT}/app:latest && break || sleep 5; done

