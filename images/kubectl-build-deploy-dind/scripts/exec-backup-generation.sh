#!/bin/bash

set +x
##############################################
#   it is possible to override the retention using a variable defined in the api
#
#   if you want to use a different retention period for production branches, you can use the following
#   LAGOON_BACKUP_PROD_RETENTION="H:D:W:M"

#   if you want to use a different retention period for development branches, you can use the following
#   LAGOON_BACKUP_DEV_RETENTION="H:D:W:M"
#
#   if you want to use a different retention period for pullrequest environments, you can use the following
#   LAGOON_BACKUP_PR_RETENTION="H:D:W:M"
#
#   Where the value H:D:W:M (hourly:daily:weekly:monthly) is numbers representing the retention period
#   eg: 0:7:6:1
#   0 Hourly
#   7 Daily
#   6 Weekly
#   1 Montly
#
##############################################

# Implement global default value for backup retentions
if [ -z "$MONTHLY_BACKUP_DEFAULT_RETENTION" ]
then
  MONTHLY_BACKUP_DEFAULT_RETENTION=1
fi
if [ -z "$WEEKLY_BACKUP_DEFAULT_RETENTION" ]
then
  WEEKLY_BACKUP_DEFAULT_RETENTION=6
fi
if [ -z "$DAILY_BACKUP_DEFAULT_RETENTION" ]
then
  DAILY_BACKUP_DEFAULT_RETENTION=7
fi
if [ -z "$HOURLY_BACKUP_DEFAULT_RETENTION" ]
then
  HOURLY_BACKUP_DEFAULT_RETENTION=0
fi

##############################################
#   it is possible to override the schedule using a variable defined in the api
#
#   if you want to use a different schedule period for development branches, you can use the following
#   LAGOON_BACKUP_DEV_SCHEDULE="M H(22-2) * * *"
#
#   if you want to use a different retention period for pullrequest environments, you can use the following
#   LAGOON_BACKUP_PR_SCHEDULE="M H(22-2) * * *"
#
#   Where the value is a supported cronjob pattern for k8up
##############################################


##############################################
### Backup Settings
##############################################

# If k8up is supported by this cluster we create the schedule definition
if [[ "${CAPABILITIES[@]}" =~ "backup.appuio.ch/v1alpha1/Schedule" ]]; then

  # Parse out custom baas backup location variables
  if [ ! -z "$LAGOON_PROJECT_VARIABLES" ]; then
    BAAS_CUSTOM_BACKUP_ENDPOINT=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT") | "\(.value)"'))
    BAAS_CUSTOM_BACKUP_BUCKET=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_BACKUP_BUCKET") | "\(.value)"'))
    BAAS_CUSTOM_BACKUP_ACCESS_KEY=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_BACKUP_ACCESS_KEY") | "\(.value)"'))
    BAAS_CUSTOM_BACKUP_SECRET_KEY=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_BACKUP_SECRET_KEY") | "\(.value)"'))

    if [ ! -z $BAAS_CUSTOM_BACKUP_ENDPOINT ] && [ ! -z $BAAS_CUSTOM_BACKUP_BUCKET ] && [ ! -z $BAAS_CUSTOM_BACKUP_ACCESS_KEY ] && [ ! -z $BAAS_CUSTOM_BACKUP_SECRET_KEY ]; then
      CUSTOM_BAAS_BACKUP_ENABLED=1

      HELM_CUSTOM_BAAS_BACKUP_ACCESS_KEY=${BAAS_CUSTOM_BACKUP_ACCESS_KEY}
      HELM_CUSTOM_BAAS_BACKUP_SECRET_KEY=${BAAS_CUSTOM_BACKUP_SECRET_KEY}
    else
      kubectl --insecure-skip-tls-verify -n ${NAMESPACE} delete secret baas-custom-backup-credentials --ignore-not-found
    fi
  fi

  # Parse out custom baas restore location variables
  if [ ! -z "$LAGOON_PROJECT_VARIABLES" ]; then
    BAAS_CUSTOM_RESTORE_ENDPOINT=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT") | "\(.value)"'))
    BAAS_CUSTOM_RESTORE_BUCKET=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_RESTORE_BUCKET") | "\(.value)"'))
    BAAS_CUSTOM_RESTORE_ACCESS_KEY=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY") | "\(.value)"'))
    BAAS_CUSTOM_RESTORE_SECRET_KEY=($(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY") | "\(.value)"'))

    if [ ! -z $BAAS_CUSTOM_RESTORE_ENDPOINT ] && [ ! -z $BAAS_CUSTOM_RESTORE_BUCKET ] && [ ! -z $BAAS_CUSTOM_RESTORE_ACCESS_KEY ] && [ ! -z $BAAS_CUSTOM_RESTORE_SECRET_KEY ]; then
      HELM_CUSTOM_BAAS_RESTORE_ACCESS_KEY=${BAAS_CUSTOM_RESTORE_ACCESS_KEY}
      HELM_CUSTOM_BAAS_RESTORE_SECRET_KEY=${BAAS_CUSTOM_RESTORE_SECRET_KEY}
    else
      kubectl --insecure-skip-tls-verify -n ${NAMESPACE} delete secret baas-custom-restore-credentials --ignore-not-found
    fi
  fi

  if ! kubectl --insecure-skip-tls-verify -n ${NAMESPACE} get secret baas-repo-pw &> /dev/null; then
    # Create baas-repo-pw secret based on the project secret
    kubectl --insecure-skip-tls-verify -n ${NAMESPACE} create secret generic baas-repo-pw --from-literal=repo-pw=$(echo -n "$PROJECT_SECRET-BAAS-REPO-PW" | sha256sum | cut -d " " -f 1)
  fi

  TEMPLATE_PARAMETERS=()

  # Check for custom baas bucket name
  if [ ! -z "$LAGOON_PROJECT_VARIABLES" ]; then
    BAAS_BUCKET_NAME=$(echo $LAGOON_PROJECT_VARIABLES | jq -r '.[] | select(.name == "LAGOON_BAAS_BUCKET_NAME") | "\(.value)"')
  fi
  if [ -z $BAAS_BUCKET_NAME ]; then
    BAAS_BUCKET_NAME=baas-${PROJECT}
  fi

  # Pull in .lagoon.yml variables
  PRODUCTION_MONTHLY_BACKUP_RETENTION=$(cat .lagoon.yml | shyaml get-value backup-retention.production.monthly "")
  PRODUCTION_WEEKLY_BACKUP_RETENTION=$(cat .lagoon.yml | shyaml get-value backup-retention.production.weekly "")
  PRODUCTION_DAILY_BACKUP_RETENTION=$(cat .lagoon.yml | shyaml get-value backup-retention.production.daily "")
  PRODUCTION_HOURLY_BACKUP_RETENTION=$(cat .lagoon.yml | shyaml get-value backup-retention.production.hourly "")

  # Set template parameters for retention values (prefer .lagoon.yml values over supplied defaults after ensuring they are valid integers via "-eq" comparison)
  if [[ ! -z $PRODUCTION_MONTHLY_BACKUP_RETENTION ]] && [[ "$PRODUCTION_MONTHLY_BACKUP_RETENTION" -eq "$PRODUCTION_MONTHLY_BACKUP_RETENTION" ]] && [[ $ENVIRONMENT_TYPE = 'production' ]]; then
    MONTHLY_BACKUP_DEFAULT_RETENTION=${PRODUCTION_MONTHLY_BACKUP_RETENTION}
  else
    MONTHLY_BACKUP_RETENTION=${MONTHLY_BACKUP_DEFAULT_RETENTION}
  fi
  if [[ ! -z $PRODUCTION_WEEKLY_BACKUP_RETENTION ]] && [[ "$PRODUCTION_WEEKLY_BACKUP_RETENTION" -eq "$PRODUCTION_WEEKLY_BACKUP_RETENTION" ]] && [[ $ENVIRONMENT_TYPE = 'production' ]]; then
    WEEKLY_BACKUP_DEFAULT_RETENTION=${PRODUCTION_WEEKLY_BACKUP_RETENTION}
  else
    WEEKLY_BACKUP_RETENTION=${WEEKLY_BACKUP_DEFAULT_RETENTION}
  fi
  if [[ ! -z $PRODUCTION_DAILY_BACKUP_RETENTION ]] && [[ "$PRODUCTION_DAILY_BACKUP_RETENTION" -eq "$PRODUCTION_DAILY_BACKUP_RETENTION" ]] && [[ $ENVIRONMENT_TYPE = 'production' ]]; then
    DAILY_BACKUP_DEFAULT_RETENTION=${PRODUCTION_DAILY_BACKUP_RETENTION}
  else
    DAILY_BACKUP_RETENTION=${DAILY_BACKUP_DEFAULT_RETENTION}
  fi
  if [[ ! -z $PRODUCTION_HOURLY_BACKUP_RETENTION ]] && [[ "$PRODUCTION_HOURLY_BACKUP_RETENTION" -eq "$PRODUCTION_HOURLY_BACKUP_RETENTION" ]] && [[ $ENVIRONMENT_TYPE = 'production' ]]; then
    HOURLY_BACKUP_DEFAULT_RETENTION=${PRODUCTION_HOURLY_BACKUP_RETENTION}
  else
    HOURLY_BACKUP_RETENTION=${HOURLY_BACKUP_DEFAULT_RETENTION}
  fi

  set +x
  ##############################################
  # check if the feature for custom backup configuration is enabled LAGOON_FEATURE_FLAG(_FORCE|_DEFAULT)_CUSTOM_BACKUP_CONFIG=enabled
  # this feature is experimental and may cause issues with your backups if incorrectly used, talk to your lagoon administrators before you use this
  #      _
  #   __| | __ _ _ __   __ _  ___ _ __
  #  / _` |/ _` | '_ \ / _` |/ _ \ '__|
  # | (_| | (_| | | | | (_| |  __/ |
  #  \__,_|\__,_|_| |_|\__, |\___|_|
  #                    |___/
  ##############################################

  if [ "$(featureFlag CUSTOM_BACKUP_CONFIG)" = enabled ]; then
  # check if a specific override has been defined in the api
    case "$BUILD_TYPE" in
        promote)
            if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
                # check if the API defined variable LAGOON_BACKUP_PROD_RETENTION contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_BACKUP_PROD_RETENTION
                BACKUP_RETENTION=$(projectEnvironmentVariableCheck LAGOON_BACKUP_PROD_RETENTION "${LAGOON_FEATURE_BACKUP_PROD_RETENTION}")
                if [ ! -z "$BACKUP_RETENTION" ]; then
                    IFS=':' read -ra BACKUP_RETENTION_SPLIT <<< "$BACKUP_RETENTION"
                    HOURLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[0]}
                    DAILY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[1]}
                    WEEKLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[2]}
                    MONTHLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[3]}
                fi
            fi
            ;;
        branch)
            if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
                # check if the API defined variable LAGOON_BACKUP_PROD_RETENTION contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_BACKUP_PROD_RETENTION
                BACKUP_RETENTION=$(projectEnvironmentVariableCheck LAGOON_BACKUP_PROD_RETENTION "${LAGOON_FEATURE_BACKUP_PROD_RETENTION}")
                if [ ! -z "$BACKUP_RETENTION" ]; then
                    IFS=':' read -ra BACKUP_RETENTION_SPLIT <<< "$BACKUP_RETENTION"
                    HOURLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[0]}
                    DAILY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[1]}
                    WEEKLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[2]}
                    MONTHLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[3]}
                fi
            fi
            if [ "${ENVIRONMENT_TYPE}" == "development" ]; then
                # check if the API defined variable LAGOON_BACKUP_DEV_RETENTION contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_DEV_RETENTION
                BACKUP_RETENTION=$(projectEnvironmentVariableCheck LAGOON_BACKUP_DEV_RETENTION "${LAGOON_FEATURE_BACKUP_DEV_RETENTION}")
                if [ ! -z "$BACKUP_RETENTION" ]; then
                    IFS=':' read -ra BACKUP_RETENTION_SPLIT <<< "$BACKUP_RETENTION"
                    HOURLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[0]}
                    DAILY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[1]}
                    WEEKLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[2]}
                    MONTHLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[3]}
                fi
            fi
            ;;
        pullrequest)
            # check if the API defined variable LAGOON_BACKUP_PR_RETENTION contains what is needed
            # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_PR_RETENTION
            BACKUP_RETENTION=$(projectEnvironmentVariableCheck LAGOON_BACKUP_PR_RETENTION "${LAGOON_FEATURE_BACKUP_PR_RETENTION}")
            if [ ! -z "$BACKUP_RETENTION" ]; then
                IFS=':' read -ra BACKUP_RETENTION_SPLIT <<< "$BACKUP_RETENTION"
                HOURLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[0]}
                DAILY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[1]}
                WEEKLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[2]}
                MONTHLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[3]}
            fi
            if [ -z "$BACKUP_RETENTION" ];then
                ## fall back to dev retention if no pr retention is defined
                # check if the API defined variable LAGOON_BACKUP_DEV_RETENTION contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_DEV_RETENTION
                BACKUP_RETENTION=$(projectEnvironmentVariableCheck LAGOON_BACKUP_DEV_RETENTION "${LAGOON_FEATURE_BACKUP_DEV_RETENTION}")
                if [ ! -z "$BACKUP_RETENTION" ]; then
                    IFS=':' read -ra BACKUP_RETENTION_SPLIT <<< "$BACKUP_RETENTION"
                    HOURLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[0]}
                    DAILY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[1]}
                    WEEKLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[2]}
                    MONTHLY_BACKUP_DEFAULT_RETENTION=${BACKUP_RETENTION_SPLIT[3]}
                fi
            fi
            ;;
        *)
            echo "${BUILD_TYPE} not implemented"; exit 1;
    esac
  fi
  set -x

  MONTHLY_BACKUP_RETENTION=${MONTHLY_BACKUP_DEFAULT_RETENTION}
  WEEKLY_BACKUP_RETENTION=${WEEKLY_BACKUP_DEFAULT_RETENTION}
  DAILY_BACKUP_RETENTION=${DAILY_BACKUP_DEFAULT_RETENTION}
  HOURLY_BACKUP_RETENTION=${HOURLY_BACKUP_DEFAULT_RETENTION}

  # Set template parameters for backup schedule value (prefer .lagoon.yml values over supplied defaults after ensuring they are valid)
  PRODUCTION_BACKUP_SCHEDULE=$(cat .lagoon.yml | shyaml get-value backup-schedule.production "")

  if [[ ! -z $PRODUCTION_BACKUP_SCHEDULE ]] && [[ $ENVIRONMENT_TYPE = 'production' ]]; then
    if [[ "$PRODUCTION_BACKUP_SCHEDULE" =~ ^M\  ]]; then
      DEFAULT_BACKUP_SCHEDULE=${PRODUCTION_BACKUP_SCHEDULE}
    else
      echo "Error parsing custom backup schedule: '$PRODUCTION_BACKUP_SCHEDULE'"; exit 1
    fi
  fi

  set +x
  if [ "$(featureFlag CUSTOM_BACKUP_CONFIG)" = enabled ]; then
  # check if a specific override has been defined in the api
    case "$BUILD_TYPE" in
        promote)
            if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
                # check if the API defined variable LAGOON_BACKUP_PROD_SCHEDULE contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_DEV_SCHEDULE
                DEFAULT_BACKUP_SCHEDULE=$(projectEnvironmentVariableCheck LAGOON_BACKUP_PROD_SCHEDULE "${LAGOON_FEATURE_BACKUP_PROD_SCHEDULE}")
            fi
            ;;
        branch)
            if [ "${ENVIRONMENT_TYPE}" == "production" ]; then
                # check if the API defined variable LAGOON_BACKUP_PROD_SCHEDULE contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_DEV_SCHEDULE
                DEFAULT_BACKUP_SCHEDULE=$(projectEnvironmentVariableCheck LAGOON_BACKUP_PROD_SCHEDULE "${LAGOON_FEATURE_BACKUP_PROD_SCHEDULE}")
            fi
            if [ "${ENVIRONMENT_TYPE}" == "development" ]; then
                # check if the API defined variable LAGOON_BACKUP_DEV_SCHEDULE contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_DEV_SCHEDULE
                DEFAULT_BACKUP_SCHEDULE=$(projectEnvironmentVariableCheck LAGOON_BACKUP_DEV_SCHEDULE "${LAGOON_FEATURE_BACKUP_DEV_SCHEDULE}")
            fi
            ;;
        pullrequest)
            # check if the API defined variable LAGOON_BACKUP_PR_SCHEDULE contains what is needed
            # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_PR_SCHEDULE
            DEFAULT_BACKUP_SCHEDULE=$(projectEnvironmentVariableCheck LAGOON_BACKUP_PR_SCHEDULE "${LAGOON_FEATURE_BACKUP_PR_SCHEDULE}")
            if [ -z "$DEFAULT_BACKUP_SCHEDULE" ];then
                ## fall back to dev schedule if no pr schedule is defined
                # check if the API defined variable LAGOON_BACKUP_DEV_SCHEDULE contains what is needed
                # if one in the API is not defined, fall back to what could be injected by the controller LAGOON_FEATURE_BACKUP_DEV_SCHEDULE
                DEFAULT_BACKUP_SCHEDULE=$(projectEnvironmentVariableCheck LAGOON_BACKUP_DEV_SCHEDULE "${LAGOON_FEATURE_BACKUP_DEV_SCHEDULE}")
            fi
            ;;
        *)
            echo "${BUILD_TYPE} not implemented"; exit 1;
    esac
  fi
  set -x

  # Implement global default value for backup schedule
  if [ -z "$DEFAULT_BACKUP_SCHEDULE" ]
  then
    DEFAULT_BACKUP_SCHEDULE="M H(22-2) * * *"
  fi

  BACKUP_SCHEDULE=$( /kubectl-build-deploy/scripts/convert-crontab.sh "${NAMESPACE}" "${DEFAULT_BACKUP_SCHEDULE}")

  if [ ! -z $K8UP_WEEKLY_RANDOM_FEATURE_FLAG ] && [ $K8UP_WEEKLY_RANDOM_FEATURE_FLAG = 'enabled' ]; then
    # Let the controller deduplicate checks (will run weekly at a random time throughout the week)
    CHECK_SCHEDULE="@weekly-random"
  else
    # Run Checks on Sunday at 0300-0600
    CHECK_SCHEDULE=$( /kubectl-build-deploy/scripts/convert-crontab.sh "${NAMESPACE}" "M H(3-6) * * 0")
  fi

  if [ ! -z $K8UP_WEEKLY_RANDOM_FEATURE_FLAG ] && [ $K8UP_WEEKLY_RANDOM_FEATURE_FLAG = 'enabled' ]; then
    # Let the controller deduplicate prunes (will run weekly at a random time throughout the week)
    PRUNE_SCHEDULE="@weekly-random"
  else
    # Run Prune on Saturday at 0300-0600
    PRUNE_SCHEDULE=$( /kubectl-build-deploy/scripts/convert-crontab.sh "${NAMESPACE}" "M H(3-6) * * 6")
  fi

  # Set the S3 variables which should be passed to the helm chart
  if [ ! -z $CUSTOM_BAAS_BACKUP_ENABLED ]; then
    BAAS_BACKUP_ENDPOINT=${BAAS_CUSTOM_BACKUP_ENDPOINT}
    BAAS_BACKUP_BUCKET=${BAAS_CUSTOM_BACKUP_BUCKET}
    BAAS_BACKUP_SECRET_NAME='lagoon-baas-custom-backup-credentials'
  else
    BAAS_BACKUP_ENDPOINT=''
    BAAS_BACKUP_BUCKET=${BAAS_BUCKET_NAME}
    BAAS_BACKUP_SECRET_NAME=''
  fi

  OPENSHIFT_TEMPLATE="/kubectl-build-deploy/openshift-templates/backup-schedule.yml"
  helm template k8up-lagoon-backup-schedule /kubectl-build-deploy/helmcharts/k8up-schedule \
    -f /kubectl-build-deploy/values.yaml \
    --set backup.schedule="${BACKUP_SCHEDULE}" \
    --set check.schedule="${CHECK_SCHEDULE}" \
    --set prune.schedule="${PRUNE_SCHEDULE}" \
    --set prune.retention.keepMonthly=${MONTHLY_BACKUP_RETENTION} \
    --set prune.retention.keepWeekly=${WEEKLY_BACKUP_RETENTION} \
    --set prune.retention.keepDaily=${DAILY_BACKUP_RETENTION} \
    --set prune.retention.keepHourly=${HOURLY_BACKUP_RETENTION} \
    --set s3.endpoint="${BAAS_BACKUP_ENDPOINT}" \
    --set s3.bucket="${BAAS_BACKUP_BUCKET}" \
    --set s3.secretName="${BAAS_BACKUP_SECRET_NAME}" \
    --set customRestoreLocation.accessKey="${BAAS_CUSTOM_RESTORE_ACCESS_KEY}" \
    --set customRestoreLocation.secretKey="${BAAS_CUSTOM_RESTORE_SECRET_KEY}" \
    --set customBackupLocation.accessKey="${BAAS_CUSTOM_BACKUP_ACCESS_KEY}" \
    --set customBackupLocation.secretKey="${BAAS_CUSTOM_BACKUP_SECRET_KEY}" "${HELM_ARGUMENTS[@]}" > $YAML_FOLDER/k8up-lagoon-backup-schedule.yaml
fi
