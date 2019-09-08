#!/bin/bash

# use oc
OC=oc

usage() {
  echo "Usage: ./migrate-resize-pv.sh -p solr -s 20Gi -d solr -n solr-namespace -c gp2 -m gluster"
  echo "WARNING: Specify the storageclass(-m) for the migrator pvc to be created in, must be multi-az mountable"
  echo "         otherwise loss of data can occur"
  echo "Options:"
  echo "  -m <MIGRATOR_STORAGE_CLASS> #required, should be a storageclass that is multi-az mountable, eg gluster,efs,etc.."
  echo "  -p <PVC_NAME>               #required"
  echo "  -s <PVC_SIZE>               #optional, set to the size you want to resize it to, defaults to original requested claim"
  echo "  -d <DEPLOYMENT_CONFIG>      #required"
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

# echo "Select which storage class is multi-az mountable, or exit:"
# COLUMNS=1
# resourcelist=$(${OC} get sc --no-headers | awk '{print $1}')
# select opt in $(echo ${resourcelist} | tr -s " " "\n") "Q) exit"
# do
#   if [[ "$opt" == "Q) exit-mach" || $REPLY == [Qq] ]]; then
#     echo "Exiting"
#     exit 1
#   fi
#   MIGRATOR_SC=$opt
#   break
# done

# need these, make sure we have them
if [[ -z "$PVC" || -z "$DC" || -z "$NS" || -z "$MIGRATOR_SC" ]]; then
  usage
fi

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

# create the migrator pvc early and fail if it can't be created
cat << EOF | ${OC} -n ${NS} apply -f -
  apiVersion: v1
  items:
  - apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: migrator
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
  MIGRATOR_PVC_EXIST=$(${OC} -n ${NS} get pvc migrator -o name --no-headers)
  if [ "$PVC_EXIST" = "" ]; then
      exit 1
  fi

  # create a svc account
  ${OC} -n ${NS} create serviceaccount pvcreclaim
  ${OC} -n ${NS} adm policy add-scc-to-user privileged -z pvcreclaim
  # scale the DC to 0
  ${OC} -n ${NS} scale --replicas=0 dc/${DC}
  # run alpine base
  ${OC} -n ${NS} run --image alpine pv-migrator -- sh -c "while sleep 3600; do :; done"
  # change serviceaccount name so i can run as privileged
  ${OC} -n ${NS} patch deploymentconfig/pv-migrator -p '{"spec":{"template":{"spec":{"serviceAccountName": "pvcreclaim"}}}}'
  # now run as root
  ${OC} -n ${NS} patch deploymentconfig/pv-migrator -p '{"spec":{"template":{"spec":{"securityContext":{ "privileged": "true",  "runAsUser": 0 }}}}}'
  # pause the rollout
  ${OC} -n ${NS} rollout pause deploymentconfig/pv-migrator
  echo "adding ${PVC} to pv-migrator."
  ${OC} -n ${NS} volume deploymentconfig/pv-migrator --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}



  ${OC} -n ${NS} volume deploymentconfig/pv-migrator --add --name=migrator --type=persistentVolumeClaim --claim-name=migrator --mount-path=/migrator
  ${OC} -n ${NS} rollout resume deploymentconfig/pv-migrator
  ${OC} -n ${NS} rollout status deploymentconfig/pv-migrator --watch

  #
  MIGRATOR=$(${OC} -n ${NS} get pods -l run=pv-migrator -o json | jq -r '.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running") | .metadata.name' | head -n 1)
  if [[ ! $MIGRATOR ]]; then
    echo "No running pod found for migrator"
    exit 1
  fi

  echo "copy ${PVC} to storage"
  ${OC} -n ${NS} exec $MIGRATOR -- cp -Rpav /storage/${PVC} /migrator/

  TMP=$(mktemp temp.${PVC}.json.XXXX)

  echo "dumping pvc ${PVC} to ${TMP}."
  ## we can change the storage class instead of using the default
  if [ ! -z "$SC" ]; then
    ${OC} -n ${NS} get -o json pvc/${PVC} --export=true | jq 'del(.metadata.annotations, .metadata.selfLink, .spec.volumeName, .spec.storageClassName, .status)' | jq --arg PVSIZE "${PVSIZE}" '.spec.resources.requests.storage=$PVSIZE'  | jq --arg SC "${SC}" '.spec.storageClassName=$SC' > $TMP
  else
    ${OC} -n ${NS} get -o json pvc/${PVC} --export=true | jq 'del(.metadata.annotations, .metadata.selfLink, .spec.volumeName, .spec.storageClassName, .status)' | jq --arg PVSIZE "${PVSIZE}" '.spec.resources.requests.storage=$PVSIZE' > $TMP
  fi

  ${OC} -n ${NS} rollout pause deploymentconfig/pv-migrator

  ${OC} -n ${NS} volume deploymentconfig/pv-migrator --remove --name=${PVC}
  ${OC} -n ${NS} delete pvc/${PVC}
  ${OC} -n ${NS} create -f $TMP && rm $TMP
  ${OC} -n ${NS} volume deploymentconfig/pv-migrator --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}

  ${OC} -n ${NS} rollout resume deploymentconfig/pv-migrator
  ${OC} -n ${NS} rollout status deploymentconfig/pv-migrator --watch

  MIGRATOR=$(${OC} -n ${NS} get pods -l run=pv-migrator -o json | jq -r '.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running") | .metadata.name' | head -n 1)

  ${OC} -n ${NS} exec $MIGRATOR -- cp -Rpav /migrator/${PVC} /storage/
  ${OC} -n ${NS} exec $MIGRATOR -- ls -la  /storage/${PVC}

  ${OC} -n ${NS} delete deploymentconfig/pv-migrator
  ${OC} -n ${NS} delete pvc/migrator
  ${OC} -n ${NS} scale --replicas=1 dc/${DC}

  ${OC} -n ${NS} adm policy remove-scc-from-user privileged -z pvcreclaim
  ${OC} -n ${NS} delete serviceaccount pvcreclaim
fi

