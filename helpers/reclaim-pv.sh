#!/bin/bash

# written for openshift 3.7; small changes may be required for other versions.
#
# usage ./reclaim-pv.sh
# 
# using the current openshift server and namepsace this script will:
# 1. scale all deployments to zero pods
# 2. create a pod and attach all temporary pvc.
# 3. attach all other pvcs in the namepace current claims to this pod.
# 4. for each pvc, 
#      copy the contents to temporary pvc, recreate the claim.
#      this allows for the prefered pv to be used
#      attach the newly created pvc, copy contents back to it
# 6. clean up

OC=oc
PVCS=($(${OC} get pvc -o name | sed 's/persistentvolumeclaims\///'))

if [[ $# -gt 0 ]]; then
  unset PVCS
  PVCS=("${BASH_ARGV[@]}")
fi

if [[ ! ${#PVCS[@]} -gt 0 ]]; then
  echo "no PVCs found."

else
  ${OC} create serviceaccount pvcreclaim
  ${OC} adm policy add-scc-to-user privileged -z pvcreclaim

  ${OC} get dc -o name --no-headers | xargs -P3 -n1 ${OC} scale --replicas=0

  ${OC} run --image alpine pv-migrator -- sh -c "while sleep 3600; do :; done"

  # change serviceaccount name so i can run as privileged
  ${OC} patch deploymentconfig/pv-migrator -p '{"spec":{"template":{"spec":{"serviceAccountName": "pvcreclaim"}}}}'
  # now run as root
  ${OC} patch deploymentconfig/pv-migrator -p '{"spec":{"template":{"spec":{"securityContext":{ "privileged": "true",  "runAsUser": 0 }}}}}'

  ${OC} rollout pause deploymentconfig/pv-migrator

  for PVC in "${PVCS[@]}"
  do
    echo "adding ${PVC} to pv-migrator."
    ${OC} volume deploymentconfig/pv-migrator --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}
  done

cat << EOF | ${OC} apply -f -
  apiVersion: v1
  items:
  - apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: migrator
    spec:
      accessModes:
      - ReadWriteOnce
      resources:
        requests:
          storage: 20Gi
  kind: List
  metadata: {}
EOF


  ${OC} volume deploymentconfig/pv-migrator --add --name=migrator --type=persistentVolumeClaim --claim-name=migrator --mount-path=/migrator

  ${OC} rollout resume deploymentconfig/pv-migrator
  ${OC} rollout status deploymentconfig/pv-migrator --watch

  #
  MIGRATOR=$(${OC} get pods -l run=pv-migrator -o json | jq -r '.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running") | .metadata.name' | head -n 1)
  #MIGRATOR=$(${OC} get pod -o custom-columns=NAME:.metadata.name --no-headers -l run=pv-migrator)
  if [[ ! $MIGRATOR ]]; then
    echo "No running pod found for migrator"
    exit 1
  fi

  for PVC in "${PVCS[@]}"
  do
    echo "copy ${PVC} to storage"
    ${OC} exec $MIGRATOR -- cp -Rpav /storage/${PVC} /migrator/

    TMP=$(mktemp temp.${PVC}.json.XXXX)
    
    echo "dumping pvc ${PVC} to ${TMP}."
    ${OC} get -o json pvc/${PVC} --export=true | jq 'del(.metadata.annotations, .metadata.selfLink, .spec.volumeName, .status)' > $TMP


    ${OC} rollout pause deploymentconfig/pv-migrator

    ${OC} volume deploymentconfig/pv-migrator --remove --name=${PVC}
    ${OC} delete pvc/${PVC}
    ${OC} apply -f $TMP && rm $TMP
    ${OC} volume deploymentconfig/pv-migrator --add --name=${PVC} --type=persistentVolumeClaim --claim-name=${PVC} --mount-path=/storage/${PVC}

    ${OC} rollout resume deploymentconfig/pv-migrator
    ${OC} rollout status deploymentconfig/pv-migrator --watch


    MIGRATOR=$(${OC} get pods -l run=pv-migrator -o json | jq -r '.items[] | select(.metadata.deletionTimestamp == null) | select(.status.phase == "Running") | .metadata.name' | head -n 1)

    ${OC} exec $MIGRATOR -- cp -Rpav /migrator/${PVC} /storage/
    ${OC} exec $MIGRATOR -- ls -la  /storage/${PVC}




  done

  ${OC} delete deploymentconfig/pv-migrator
  ${OC} delete pvc/migrator
  ${OC} get dc -o name --no-headers | xargs -P3 -n1 ${OC} scale  --replicas=1

  ${OC} adm policy remove-scc-from-user privileged -z pvcreclaim
  ${OC} delete serviceaccount pvcreclaim

fi
