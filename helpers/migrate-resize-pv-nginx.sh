#!/bin/bash

set -e -o pipefail

# use oc
OC=oc

usage() {
  echo "Usage: ./migrate-resize-pv-nginx.sh -p solr -s 20Gi -d nginx,cli -n solr-namespace -c gp2 -m gluster"
  echo "WARNING: Specify the storageclass(-m) for the migrator pvc to be created in, must be multi-az mountable"
  echo "         otherwise loss of data can occur"
  echo "Options:"
  echo "  -m <MIGRATOR_STORAGE_CLASS> #required, should be a storageclass that is multi-az mountable, eg gluster,efs,etc.."
  echo "  -p <PVC_NAME>               #required"
  echo "  -s <PVC_SIZE>               #optional, set to the size you want to resize it to, defaults to original requested claim"
  echo "  -d <DEPLOYMENT_CONFIGS>     #required, separate with commas to define multiple deploymentconfigs"
  echo "  -n <NAMESPACE>              #required"
  echo "  -c <STORAGE_CLASS>          #optional, change the storage class of the new migrated/resized pv"
  exit 1
}

if [[ ! $@ =~ ^\-.+ ]]
then
  usage
fi

while getopts ":p:d:s:n:c:m:h:" opt; do
  case ${opt} in
    p ) # process option p
      PVC=$OPTARG;;
    d ) # process option d
      DC=$OPTARG;;
    s ) # process option s
      PVSIZE=$OPTARG;;
    n ) # process option n
      NS=$OPTARG;;
    c ) # process option c
      SC=$OPTARG;;
    m ) # process option m
      MIGRATOR_SC=$OPTARG;;
    h )
      usage;;
    *)
      usage;;
  esac
done

# need these, make sure we have them
if [[ -z "$PVC" || -z "$DC" || -z "$NS" || -z "$MIGRATOR_SC" ]]; then
  usage
fi

# convert given DC into an array
IFS=',' read -r -a DC_ARRAY <<< "$DC"

# check if the storage class exists if a request to change is made
if [ ! -z "$SC" ]; then
  SC_EXIST=$(${OC} -n ${NS} get sc ${SC} -o name --no-headers)
  if [ "$SC_EXIST" = "" ]; then
      exit 1
  fi
fi
# check if the migrator storage class exists too
if [ ! -z "$MIGRATOR_SC" ]; then
  MIGRATOR_SC_EXIST=$(${OC} -n ${NS} get sc ${MIGRATOR_SC} -o name --no-headers)
  if [ "$MIGRATOR_SC_EXIST" = "" ]; then
      exit 1
  fi
fi
if [ "$(${OC} -n ${NS} get sc ${MIGRATOR_SC} -o json | jq -r .provisioner)" == "kubernetes.io/aws-ebs" ]; then
  echo "You are using ${MIGRATOR_SC} which uses aws-ebs. This may result in loss of data if the pvc is created in a different az to the migrator pod."
  read -p "Are you sure? " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]
  then
    echo "Proceeding"
  else
    exit 1
  fi
fi

PVC_EXIST=$(${OC} -n ${NS} get pvc ${PVC} -o name --no-headers)
if [ "$PVC_EXIST" = "" ]; then
    exit 1
else
  # get the existing size of the PV
  OLDSIZE=$(${OC} -n ${NS} get -o json pvc/${PVC} --export=true | jq -r '.spec.resources.requests.storage')
  if [ -z "$PVSIZE" ]; then
    echo "using existing PV size when migrating - $OLDSIZE"
    #if a new size is not defined, use the original size when creating the new pv
    PVSIZE=$OLDSIZE
  else
    if [ "$PVSIZE" != "$OLDSIZE" ]; then
      echo "migrated PV will be created with the new size $PVSIZE"
    fi
  fi

  # cleanup objects in case they already exist.
  ${OC} -n ${NS} adm policy remove-scc-from-user privileged -z pvc-migrator || true
  ${OC} -n ${NS} delete serviceaccount pvc-migrator || true
  ${OC} -n ${NS} delete deploymentconfig/pv-migrator || true
  ${OC} -n ${NS} delete pvc/${PVC}-migrator --wait || true

# create the migrator pvc early and fail if it can't be created
cat << EOF | ${OC} -n ${NS} apply -f -
  apiVersion: v1
  items:
  - apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: ${PVC}-migrator
    spec:
      storageClassName: ${MIGRATOR_SC}
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: $OLDSIZE
  kind: List
  metadata: {}
EOF
  MIGRATOR_PVC_EXIST=$(${OC} -n ${NS} get pvc ${PVC}-migrator -o name --no-headers)
  if [ "$PVC_EXIST" = "" ]; then
      exit 1
  fi



  # create a svc account
  ${OC} -n ${NS} create serviceaccount pvc-migrator
  ${OC} -n ${NS} adm policy add-scc-to-user privileged -z pvc-migrator

  # run alpine base
  ${OC} -n ${NS} run --image alpine pv-migrator -- sh -c "trap : TERM INT; (while true; do sleep 3600; done) & wait"
  # pause the rollout to allow making multiple changes on the deploymentconfig
  ${OC} -n ${NS} rollout pause deploymentconfig/pv-migrator
  # change serviceaccount name so i can run as privileged
  ${OC} -n ${NS} patch deploymentconfig/pv-migrator -p '{"spec":{"template":{"spec":{"serviceAccountName": "pvc-migrator"}}}}'
  # now run as root
  ${OC} -n ${NS} patch deploymentconfig/pv-migrator -p '{"spec":{"template":{"spec":{"securityContext":{ "privileged": "true",  "runAsUser": 0 }}}}}'
  echo "adding ${PVC} to pv-migrator."
  ${OC} -n ${NS} set volume deploymentconfig/pv-migrator --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage
  # add migration pvc to migrator
  ${OC} -n ${NS} set volume deploymentconfig/pv-migrator --add --name=${PVC}-migrator --type=persistentVolumeClaim --claim-name=${PVC}-migrator --mount-path=/migrator
  ${OC} -n ${NS} rollout resume deploymentconfig/pv-migrator
  ${OC} -n ${NS} rollout status deploymentconfig/pv-migrator --watch

  # check if the migrator pod is actually running
  MIGRATOR=$(${OC} -n ${NS} get pods -l run=pv-migrator -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')
  if [[ ! $MIGRATOR ]]; then
    echo "No running pod found for migrator"
    exit 1
  fi

  echo "copy ${PVC} to ${PVC}-migrator"
  ${OC} -n ${NS} exec $MIGRATOR -- cp -Rpav /storage/. /migrator

  # update actual production pods with migrator PVC (this allows them to keep running while we migrate a second time)
  for DC in "${DC_ARRAY[@]}"
  do
    ${OC} -n ${NS} set volume deploymentconfig/${DC} --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC}-migrator --overwrite
  done
  for DC in "${DC_ARRAY[@]}"
  do
    ${OC} -n ${NS} rollout status deploymentconfig/${DC} --watch
  done

  TMP=$(mktemp temp.${PVC}.json.XXXX)

  echo "dumping pvc ${PVC} to ${TMP}."
  ## we can change the storage class instead of using the default
  if [ ! -z "$SC" ]; then
    ${OC} -n ${NS} get -o json pvc/${PVC} --export=true | jq 'del(.metadata.annotations, .metadata.selfLink, .spec.volumeName, .spec.storageClassName, .status)' | jq --arg PVSIZE "${PVSIZE}" '.spec.resources.requests.storage=$PVSIZE'  | jq --arg SC "${SC}" '.spec.storageClassName=$SC' > $TMP
  else
    ${OC} -n ${NS} get -o json pvc/${PVC} --export=true | jq 'del(.metadata.annotations, .metadata.selfLink, .spec.volumeName, .spec.storageClassName, .status)' | jq --arg PVSIZE "${PVSIZE}" '.spec.resources.requests.storage=$PVSIZE' > $TMP
  fi

  # scale down migrator to change the volumes on it
  ${OC} -n ${NS} scale --replicas=0 deploymentconfig/pv-migrator
  # remove the original PVC from the migrator

  # remove the original PVC now that we have migrated everything to the PVC-migrator, we call `--wait` to make sure the PVC really has been deleted
  ${OC} -n ${NS} delete pvc/${PVC} --wait

  # recreate the PVC based on what we dumped before
  ${OC} -n ${NS} create -f $TMP && rm $TMP

  # check if deploymenconfig has at least 1 ready pod, if not, scale and check again in 3 secounds.
  while [[ $(${OC} -n ${NS} get deploymentconfig/pv-migrator -o go-template --template='{{.status.readyReplicas}}') = "<no value>" ]] || [[ $(${OC} -n ${NS} get deploymentconfig/pv-migrator -o go-template --template='{{.status.readyReplicas}}') = "0" ]]
  do
    # Sending the scaling command while it already scaling is no problem for the Kubernetes API
    ${OC} -n ${NS} scale --replicas=1 deploymentconfig/pv-migrator
    sleep 3
  done

  MIGRATOR=$(${OC} -n ${NS} get pods -l run=pv-migrator -o json | jq -r '[.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running")] | first | .metadata.name // empty')
  if [[ ! $MIGRATOR ]]; then
    echo "No running pod found for migrator"
    exit 1
  fi

  # copy data from the pvc-migrator to the newly created pvc
  ${OC} -n ${NS} exec $MIGRATOR -- cp -Rpav /migrator/. /storage
  ${OC} -n ${NS} exec $MIGRATOR -- ls -la  /storage

  # updating the production pods with the copied storage again
  for DC in "${DC_ARRAY[@]}"
  do
    ${OC} -n ${NS} set volume deploymentconfig/${DC} --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --overwrite
  done
  for DC in "${DC_ARRAY[@]}"
  do
    ${OC} -n ${NS} rollout status deploymentconfig/${DC} --watch
  done

  # delete the migrator DC and PVC
  ${OC} -n ${NS} delete deploymentconfig/pv-migrator
  ${OC} -n ${NS} delete pvc/${PVC}-migrator

  # cleanup serviceaccounts
  ${OC} -n ${NS} adm policy remove-scc-from-user privileged -z pvc-migrator
  ${OC} -n ${NS} delete serviceaccount pvc-migrator
fi
