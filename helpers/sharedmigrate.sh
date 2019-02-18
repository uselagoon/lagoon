#!/bin/sh

for util in oc svcat jq; do 
which ${util} > /dev/null
if [ $? -gt 0 ]; then
  echo "please install ${util}"
  exit 1
fi
done;

usage() {
  cat << EOF
    ${0}: migrate a mariadb servicebroker to another mariadb servicebroker
    This script is useful when needing to change either the class or the plan
    of and existing service broker.
    By default, it will use:
      'lagoon-dbaas-mariadb-apb' as the class,
      'production' as the plan,
      current openshift context as the namespace, and
      first servicebroker in the namespace.

    when completed, run with -x to delete migration pvc, dc and serviceaccount.

    e.g: $0 -n mysite-devel -c lagoon-dbaas-mariadb-apb -p development -i mariadb
         $0 -n mysite-devel -x
EOF
}

# n- namespace
# c- class ( lagoon-dbaas-mariadb-apb )
# p- plan ( production / stage )

args=`getopt n:c:p:i:xh $*`
if [[ $# -eq 0 ]]; then
  usage
  exit
fi

# set some defaults
NAMESPACE=$(oc project -q)
PLAN=production
CLASS=lagoon-dbaas-mariadb-apb

set -- $args
for i
do
    case "$i" in
    -n)
        NAMESPACE="$2"; shift;
  	    shift;;
    -c)
        CLASS="$2"; shift;
        shift;;
  	-p)
        PLAN="$2"; shift;
        shift;;
  	-i)
        INSTANCE="$2"; shift;
  	    shift;;
    -h)
        usage
        exit 0
        shift;;

    -x)
        echo "cleaning up "
        oc -n ${NAMESPACE} delete dc/migrator
        oc -n ${NAMESPACE} delete pvc/migrator
        oc -n ${NAMESPACE} adm policy remove-scc-from-user privileged -z migrator
        oc -n ${NAMESPACE} delete serviceaccount migrator
        exit 0
        shift;;

    --)
        shift; break;;
    esac
done

# set a default instance, if not specified.
if [ -z ${INSTANCE+x} ]; then
  INSTANCE=$(svcat -n ${NAMESPACE} get instance -o json |jq -r '.items[0].metadata.name')
  echo "instance not specified, using $INSTANCE"
fi

# verify instance exists
svcat -n ${NAMESPACE} get instance $INSTANCE
if [ $? -gt 0 ] ;then
    echo "no instance found"
    exit 2
fi

echo "Verifying secret ${INSTANCE}-servicebroker-credentials "
oc -n ${NAMESPACE} get --insecure-skip-tls-verify secret ${INSTANCE}-servicebroker-credentials || svcat bind $INSTANCE --name ${INSTANCE}-servicebroker-credentials

# validate $broker

oc -n ${NAMESPACE} create serviceaccount migrator
oc -n ${NAMESPACE} adm policy add-scc-to-user privileged -z migrator

oc -n ${NAMESPACE} run --image mariadb --env="MYSQL_RANDOM_ROOT_PASSWORD=yes"  migrator

# pause and make some changes
oc -n ${NAMESPACE} rollout pause deploymentconfig/migrator

# We don't care about the database in /var/lib/mysql; just privilege it and let it do its thing. 
oc -n ${NAMESPACE} patch deploymentconfig/migrator -p '{"spec":{"template":{"spec":{"serviceAccountName": "migrator"}}}}'
oc -n ${NAMESPACE} patch deploymentconfig/migrator -p '{"spec":{"template":{"spec":{"securityContext":{ "privileged": "true",  "runAsUser": 0 }}}}}'
oc -n ${NAMESPACE} patch deploymentconfig/migrator -p '{"spec":{"strategy":{"type":"Recreate"}}}'


# create a volume to store the dump.
cat << EOF | oc -n ${NAMESPACE} apply -f -
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

oc -n ${NAMESPACE} volume deploymentconfig/migrator --add --name=migrator --type=persistentVolumeClaim --claim-name=migrator --mount-path=/migrator


# look up the secret from the instance and add it to the new container
SECRET=$(svcat -n ${NAMESPACE} get binding -o json  |jq -r ".items[] | select (.spec.instanceRef.name == \"$INSTANCE\") | .spec.secretName")
echo secret: $SECRET
oc -n ${NAMESPACE} set env --from=secret/${SECRET} --prefix=OLD_ dc/migrator

oc -n ${NAMESPACE} rollout resume deploymentconfig/migrator
oc -n ${NAMESPACE} rollout latest deploymentconfig/migrator
oc -n ${NAMESPACE} rollout status deploymentconfig/migrator --watch

sleep 20;
# Do the dump:
POD=$(oc -n ${NAMESPACE} get pods -o json --show-all=false -l run=migrator | jq -r '.items[].metadata.name')

oc -n ${NAMESPACE} exec $POD -- bash -c 'time mysqldump -h $OLD_DB_HOST -u $OLD_DB_USER -p${OLD_DB_PASSWORD} $OLD_DB_NAME > /migrator/migration.sql'

echo "DUMP IS DONE;"
oc -n ${NAMESPACE} exec $POD -- ls -al /migrator/migration.sql || exit 1
oc -n ${NAMESPACE} exec $POD -- head /migrator/migration.sql
oc -n ${NAMESPACE} exec $POD -- tail /migrator/migration.sql || exit 1


printf "\n\n\nLAST CHANCE TO CANCEL BEFORE I DELETE THE OLD SERVICEBROKER.\n\n"
echo "sleeping 30 seconds..."
sleep 30

# delete the old servicebroker
time svcat -n ${NAMESPACE} unbind $INSTANCE
time svcat -n ${NAMESPACE} deprovision $INSTANCE --wait --interval 2s --timeout=1h
echo "===== old instance deprovisioned, waiting 30 seconds."
sleep 30;

echo "===== provisioning new $CLASS of plan $PLAN"
time svcat -n ${NAMESPACE} provision $INSTANCE --class $CLASS --plan $PLAN --wait
echo "      and binding"
time svcat -n ${NAMESPACE} bind $INSTANCE --name ${INSTANCE}-servicebroker-credentials --wait

until oc get -n ${NAMESPACE} secret ${INSTANCE}-servicebroker-credentials
do
  echo "Secret ${SERVICE_NAME}-servicebroker-credentials not available yet, waiting for 5 secs"
  sleep 5
done


echo "rolling out migrator again so the secrets get propagated."
oc -n ${NAMESPACE} rollout latest deploymentconfig/migrator
oc -n ${NAMESPACE} rollout status deploymentconfig/migrator --watch

sleep 10;

# Do the dump:
POD=$(oc -n ${NAMESPACE} get pods -o json --show-all=false -l run=migrator | jq -r '.items[].metadata.name')

oc -n ${NAMESPACE} exec $POD -- bash -c 'cat /migrator/migration.sql |sed -e "s/DEFINER[ ]*=[ ]*[^*]*\*/\*/" | mysql -h $OLD_DB_HOST -u $OLD_DB_USER -p${OLD_DB_PASSWORD} $OLD_DB_NAME'


# Load credentials out of secret
SECRETS=$(mktemp).yaml
echo "Exporting ${INSTANCE}-servicebroker-credentials into $SECRETS   "
oc -n ${NAMESPACE} get --insecure-skip-tls-verify secret ${INSTANCE}-servicebroker-credentials -o yaml > $SECRETS

DB_HOST=$(cat $SECRETS | shyaml get-value data.DB_HOST | base64 -D)
DB_USER=$(cat $SECRETS | shyaml get-value data.DB_USER | base64 -D)
DB_PASSWORD=$(cat $SECRETS | shyaml get-value data.DB_PASSWORD | base64 -D)
DB_NAME=$(cat $SECRETS | shyaml get-value data.DB_NAME | base64 -D)
DB_PORT=$(cat $SECRETS | shyaml get-value data.DB_PORT | base64 -D)

SERVICE_NAME_UPPERCASE=$(echo $INSTANCE | tr [:lower:] [:upper:])
oc -n $NAMESPACE patch configmap lagoon-env \
   -p "{\"data\":{\"${SERVICE_NAME_UPPERCASE}_HOST\":\"${DB_HOST}\", \"${SERVICE_NAME_UPPERCASE}_USERNAME\":\"${DB_USER}\", \"${SERVICE_NAME_UPPERCASE}_PASSWORD\":\"${DB_PASSWORD}\", \"${SERVICE_NAME_UPPERCASE}_DATABASE\":\"${DB_NAME}\", \"${SERVICE_NAME_UPPERCASE}_PORT\":\"${DB_PORT}\"}}"
