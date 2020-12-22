import { promisify } from 'util';
import KubernetesClient from 'kubernetes-client';
import sleep from "es7-sleep";
import R from 'ramda';
import sha1 from 'sha1';
import crypto from 'crypto';
import moment from 'moment';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getOpenShiftInfoForProject, addOrUpdateEnvironment, getEnvironmentByName, addDeployment, getBillingGroupForProject } from '@lagoon/commons/dist/api';

import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { consumeTasks, initSendToLagoonTasks, createTaskMonitor } from '@lagoon/commons/dist/tasks';

initSendToLagoonLogs();
initSendToLagoonTasks();

const CI = process.env.CI || "false"
const lagoonGitSafeBranch = process.env.LAGOON_GIT_SAFE_BRANCH || "master"
const lagoonVersion = process.env.LAGOON_VERSION
const overwriteKubectlBuildDeployDindImage = process.env.OVERWRITE_KUBECTL_BUILD_DEPLOY_DIND_IMAGE
const registry = process.env.REGISTRY || "registry.lagoon.svc:5000"
const monthlyBackupRetention = process.env.MONTHLY_BACKUP_DEFAULT_RETENTION || "1"
const weeklyBackupRetention = process.env.WEEKLY_BACKUP_DEFAULT_RETENTION || "4"
const dailyBackupRetention = process.env.DAILY_BACKUP_DEFAULT_RETENTION || "7"
const lagoonEnvironmentType = process.env.LAGOON_ENVIRONMENT_TYPE || "development"
const jwtSecret = process.env.JWTSECRET || "super-secret-string"

const messageConsumer = async msg => {
  const {
    projectName,
    branchName: branch,
    sha,
    type: buildType,
    headBranchName: headBranch,
    headSha,
    baseBranchName: baseBranch,
    baseSha,
    pullrequestTitle,
    promoteSourceEnvironment,
  } = JSON.parse(msg.content.toString())

  // @TODO: Actually inject the environment name into the message
  const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')
  var environmentName = ocsafety(branch)

  logger.verbose(`Received DeployKubernetes task for project: ${projectName}, environment: ${environmentName}, sha: ${sha}`);

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project
  const billingGroupResult = await getBillingGroupForProject(projectName);
  const projectBillingGroup = billingGroupResult.project

  try {

    var overlength = 58 - projectName.length;
    if ( environmentName.length > overlength ) {
      var hash = sha1(environmentName).substring(0,4)

      environmentName = environmentName.substring(0, overlength-5)
      environmentName = environmentName.concat('-' + hash)
    }

    var environmentType = 'development'
    if (
      projectOpenShift.productionEnvironment === environmentName
      || projectOpenShift.standbyProductionEnvironment === environmentName
    ) {
      environmentType = 'production'
    }
    var gitSha = sha as string
    var projectId = projectOpenShift.id
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(/\/$/, "");
    var openshiftToken = projectOpenShift.openshift.token || ""
    var openshiftProject = projectOpenShift.openshiftProjectPattern ? projectOpenShift.openshiftProjectPattern.replace('${environment}',environmentName).replace('${project}', projectName) : `${projectName}-${environmentName}`
    var openshiftName = projectOpenShift.openshift.name
    var openshiftProjectUser = projectOpenShift.openshift.projectUser || ""
    var deployPrivateKey = projectOpenShift.privateKey
    var gitUrl = projectOpenShift.gitUrl
    var projectProductionEnvironment = projectOpenShift.productionEnvironment
    var projectStandbyEnvironment = projectOpenShift.standbyProductionEnvironment
    var subfolder = projectOpenShift.subfolder || ""
    var routerPattern = projectOpenShift.openshift.routerPattern ? projectOpenShift.openshift.routerPattern.replace('${environment}',environmentName).replace('${project}', projectName) : ""
    var prHeadBranch = headBranch || ""
    var prHeadSha = headSha || ""
    var prBaseBranch = baseBranch || ""
    var prBaseSha = baseSha || ""
    var prPullrequestTitle = pullrequestTitle || ""
    var prPullrequestNumber = branch.replace('pr-','')
    var graphqlEnvironmentType = environmentType.toUpperCase()
    var graphqlGitType = buildType.toUpperCase()
    // A secret which is the same across all Environments of this Lagoon Project
    var projectSecret = crypto.createHash('sha256').update(`${projectName}-${jwtSecret}`).digest('hex');
    var alertContactHA = ""
    var alertContactSA = ""
    var uptimeRobotStatusPageIds = []
    var monitoringConfig = JSON.parse(projectOpenShift.openshift.monitoringConfig) || "invalid"
    if (monitoringConfig != "invalid"){
      alertContactHA = monitoringConfig.uptimerobot.alertContactHA || ""
      alertContactSA = monitoringConfig.uptimerobot.alertContactSA || ""
      if (monitoringConfig.uptimerobot.statusPageId) {
        uptimeRobotStatusPageIds.push(monitoringConfig.uptimerobot.statusPageId)
      }
    }
    var availability = projectOpenShift.availability || "STANDARD"
    const billingGroup = projectBillingGroup.groups.find(i => i.type == "billing" ) || ""
    if (billingGroup.uptimeRobotStatusPageId && billingGroup.uptimeRobotStatusPageId != "null" && !R.isEmpty(billingGroup.uptimeRobotStatusPageId)){
      uptimeRobotStatusPageIds.push(billingGroup.uptimeRobotStatusPageId)
    }
    var uptimeRobotStatusPageId = uptimeRobotStatusPageIds.join('-')
  } catch(error) {
    logger.error(`Error while loading information for project ${projectName}`)
    logger.error(error)
    throw(error)
  }

  // Deciding which git REF we would like deployed
  switch (buildType) {
    case "branch":
      // if we have a sha given, we use that, if not we fall back to the branch (which needs be prefixed by `origin/`
      var gitRef = gitSha ? gitSha : `origin/${branch}`
      var deployBaseRef = branch
      var deployHeadRef = null
      var deployTitle = null
      break;

    case "pullrequest":
      var gitRef = gitSha
      var deployBaseRef = prBaseBranch
      var deployHeadRef = prHeadBranch
      var deployTitle = prPullrequestTitle
      break;

    case "promote":
      var gitRef = `origin/${promoteSourceEnvironment}`
      var deployBaseRef = promoteSourceEnvironment
      var deployHeadRef = null
      var deployTitle = null
      break;
  }


  // Generates a jobconfig object
  const generateJobConfig = (buildName, secret, buildType, environment: any = {}) => {

    let buildImage = {}
    // During CI we want to use the OpenShift Registry for our build Image and use the OpenShift registry for the base Images
    if (CI == "true") {
      buildImage = "172.17.0.1:5000/lagoon/kubectl-build-deploy-dind:latest"
    } else if (overwriteKubectlBuildDeployDindImage) {
      // allow to overwrite the image we use via OVERWRITE_OC_BUILD_DEPLOY_DIND_IMAGE env variable
      buildImage = overwriteKubectlBuildDeployDindImage
    } else if (lagoonEnvironmentType == 'production') {
      // we are a production environment, use the amazeeio/ image with our current lagoon version
      buildImage = `amazeeio/kubectl-build-deploy-dind:${lagoonVersion}`
    } else {
      // we are a development enviornment, use the amazeeiolagoon image with the same branch name
      buildImage = `amazeeiolagoon/kubectl-build-deploy-dind:${lagoonGitSafeBranch}`
    }

    let jobconfig = {
      "apiVersion": "batch/v1",
      "kind": "Job",
      "metadata": {
          "creationTimestamp": null,
          "name": buildName,
          "labels": {
            "lagoon.sh/jobType": "build",
          }
      },
      "spec": {
        "backoffLimit": 0,
        "template": {
          "spec": {
            "restartPolicy": "Never",
            "volumes": [
              {
                name: secret,
                secret: {
                  secretName: secret,
                  defaultMode: 420
                }
              },
              {
                name: "lagoon-sshkey",
                secret: {
                  secretName: "lagoon-sshkey",
                  defaultMode: 420
                }
              }
            ],
            "tolerations": [
              {
                 "key": "lagoon/build",
                 "effect": "NoSchedule",
                 "operator": "Exists"
              },
              {
                 "key": "lagoon/build",
                 "effect": "PreferNoSchedule",
                 "operator": "Exists"
              }
            ],
            "containers": [
              {
                "name": "lagoon-build",
                "image": buildImage,
                "imagePullPolicy": "Always",
                "env": [
                  {
                      "name": "BUILD_TYPE",
                      "value": buildType
                  },
                  {
                      "name": "SOURCE_REPOSITORY",
                      "value": gitUrl
                  },
                  {
                      "name": "GIT_REF",
                      "value": gitRef
                  },
                  {
                      "name": "SUBFOLDER",
                      "value": subfolder
                  },
                  {
                      "name": "ENVIRONMENT",
                      "value": environmentName
                  },
                  {
                      "name": "BRANCH",
                      "value": branch
                  },
                  {
                      "name": "PROJECT",
                      "value": projectName
                  },
                  {
                      "name": "ROUTER_URL",
                      "value": routerPattern
                  },
                  {
                      "name": "ENVIRONMENT_TYPE",
                      "value": environmentType
                  },
                  {
                      "name": "ACTIVE_ENVIRONMENT",
                      "value": projectProductionEnvironment
                  },
                  {
                      "name": "STANDBY_ENVIRONMENT",
                      "value": projectStandbyEnvironment
                  },
                  {
                      "name": "KUBERNETES",
                      "value": openshiftName
                  },
                  {
                      "name": "PROJECT_SECRET",
                      "value": projectSecret
                  },
                  {
                      "name": "REGISTRY",
                      "value": registry
                  },
                  {
                    "name": "MONTHLY_BACKUP_DEFAULT_RETENTION",
                    "value": monthlyBackupRetention
                  },
                  {
                    "name": "WEEKLY_BACKUP_DEFAULT_RETENTION",
                    "value": weeklyBackupRetention
                  },
                  {
                    "name": "DAILY_BACKUP_DEFAULT_RETENTION",
                    "value": dailyBackupRetention
                  }
                ],
                "volumeMounts": [
                  {
                    name: secret,
                    readOnly: true,
                    mountPath: "/var/run/secrets/lagoon/deployer"
                  },
                  {
                    name: "lagoon-sshkey",
                    readOnly: true,
                    mountPath: "/var/run/secrets/lagoon/ssh"
                  }
                ]
              }
            ]
          }
        }
      }
    }
    if (CI == "true") {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "CI","value": CI})
    }
    if (buildType == "pullrequest") {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_HEAD_BRANCH","value": prHeadBranch})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_HEAD_SHA","value": prHeadSha})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_BASE_BRANCH","value": prBaseBranch})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_BASE_SHA","value": prBaseSha})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_TITLE","value": prPullrequestTitle})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_NUMBER","value": prPullrequestNumber})
    }
    if (buildType == "promote") {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PROMOTION_SOURCE_ENVIRONMENT","value": promoteSourceEnvironment})
    }
    if (!R.isEmpty(projectOpenShift.envVariables)) {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "LAGOON_PROJECT_VARIABLES", "value": JSON.stringify(projectOpenShift.envVariables)})
    }
    if (!R.isEmpty(environment.envVariables)) {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "LAGOON_ENVIRONMENT_VARIABLES", "value": JSON.stringify(environment.envVariables)})
    }
    if (alertContactHA != undefined && alertContactSA != undefined){
      if (availability == "HIGH") {
        jobconfig.spec.template.spec.containers[0].env.push({"name": "MONITORING_ALERTCONTACT","value": alertContactHA})
      } else {
        jobconfig.spec.template.spec.containers[0].env.push({"name": "MONITORING_ALERTCONTACT","value": alertContactSA})
      }
    } else {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "MONITORING_ALERTCONTACT","value": "unconfigured"})
    }
    if (uptimeRobotStatusPageId){
      jobconfig.spec.template.spec.containers[0].env.push({"name": "MONITORING_STATUSPAGEID","value": uptimeRobotStatusPageId})
    }

    return jobconfig
  }

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetes: any = new KubernetesClient.Core({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });


  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetesApi = new KubernetesClient.Api({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });

  // kubernetes-client does not know about the OpenShift Resources, let's teach it.
  kubernetes.ns.addResource('rolebindings');

  // Create a new Namespace if it does not exist
  let namespaceStatus = {}
  try {
    const namespacePost = promisify(kubernetes.namespace.post)
    namespaceStatus = await namespacePost({
      body: {
        "apiVersion":"v1",
        "kind":"Namespace",
        "metadata": {
          "name":openshiftProject,
          "labels": {
            "lagoon.sh/project": projectName,
            "lagoon.sh/environment": environmentName,
            "lagoon.sh/environmentType": environmentType
          }
        }
      }
    })
    logger.info(`${openshiftProject}: Namespace ${openshiftProject} created`)
  } catch (err) {
    // an already existing namespace  throws an error, we check if it's a 409, means it does already exist, so we ignore that error.
    if (err.code == 409) {
      logger.info(`${openshiftProject}: Namespace ${openshiftProject} already exists`)
    } else {
      logger.error(`Could not create namespace '${openshiftProject}': ${err.code} ${err.message}`);
      throw new Error
    }
  }

  // Update GraphQL API with information about this environment
  let environment;
  try {
    environment = await addOrUpdateEnvironment(branch, projectId, graphqlGitType, deployBaseRef, graphqlEnvironmentType, openshiftProject, deployHeadRef, deployTitle)
    logger.info(`${openshiftProject}: Created/Updated Environment in API`)
  } catch (err) {
    logger.error(err)
    throw new Error
  }


  // Create ServiceAccount if it does not exist yet.
  try {
    logger.info(`${openshiftProject}: Check if ServiceAccount lagoon-deployer already exists`)
    const serviceaccountsGet = promisify(kubernetes.ns(openshiftProject).serviceaccounts('lagoon-deployer').get)
    await serviceaccountsGet()
    logger.info(`${openshiftProject}: ServiceAccount lagoon-deployer already exists, continuing`)
  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject}: ServiceAccount lagoon-deployer does not exists, creating`)
      const serviceaccountsPost = promisify(kubernetes.ns(openshiftProject).serviceaccounts.post)
      await serviceaccountsPost({ body: {"kind":"ServiceAccount","apiVersion":"v1","metadata":{"name":"lagoon-deployer"} }})
      await sleep(2000); // sleep a bit after creating the ServiceAccount for Kubernetes to create all the secrets
      const serviceaccountsRolebindingsBody = {"kind":"RoleBinding","apiVersion":"rbac.authorization.k8s.io/v1","metadata":{"name":"lagoon-deployer-admin","namespace":openshiftProject},"roleRef":{"name":"admin","kind":"ClusterRole","apiGroup":"rbac.authorization.k8s.io"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]};
      const serviceaccountsRolebindingsPost = promisify(kubernetesApi.group(serviceaccountsRolebindingsBody).ns(openshiftProject).rolebindings.post)
      // @ts-ignore
      await serviceaccountsRolebindingsPost({ body: serviceaccountsRolebindingsBody })
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Create SSH Key Secret if not exist yet, if it does update it.
  let sshKey: any = {}
  const sshKeyBase64 = new Buffer(deployPrivateKey.replace(/\\n/g, "\n")).toString('base64')
  try {
    logger.info(`${openshiftProject}: Check if secret lagoon-sshkey exists`)
    const secretsGet = promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').get)
    sshKey = await secretsGet()
    logger.info(`${openshiftProject}: Secret lagoon-sshkey already exists, updating`)
    const secretsPut = promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').put)
    await secretsPut({ body: {"apiVersion":"v1","kind":"Secret","metadata":{"name":"lagoon-sshkey", "resourceVersion": sshKey.metadata.resourceVersion },"buildType":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})
  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject}: Secret lagoon-sshkey does not exists, creating`)
      const secretsPost = promisify(kubernetes.ns(openshiftProject).secrets.post)
      await secretsPost({ body: {"apiVersion":"v1","kind":"Secret","metadata":{"name":"lagoon-sshkey"},"buildType":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Load the Token Secret Name for our created ServiceAccount
  const serviceaccountsGet = promisify(kubernetes.ns(openshiftProject).serviceaccounts("lagoon-deployer").get)
  const serviceaccount = await serviceaccountsGet()
  // a ServiceAccount can have multiple secrets, we are interested in one that has starts with 'lagoon-deployer-token'
  let serviceaccountTokenSecret = '';
  for (var key in serviceaccount.secrets) {
    if(/^lagoon-deployer-token/.test(serviceaccount.secrets[key].name)) {
      serviceaccountTokenSecret = serviceaccount.secrets[key].name
      break;
    }
  }
  if (serviceaccountTokenSecret == '') {
    throw new Error(`${openshiftProject}: Could not find token secret for ServiceAccount lagoon-deployer`)
  }

  // @TODO: generate names with incremential numbers from the previous build number
  const randBuildId = Math.random().toString(36).substring(7);
  const buildName = `lagoon-build-${randBuildId}`;
  const jobConfig = generateJobConfig(buildName, serviceaccountTokenSecret, buildType, environment.addOrUpdateEnvironment)

  let deployment;
  try {
    const now = moment.utc();
    const apiEnvironment = await getEnvironmentByName(branch, projectId);
    deployment = await addDeployment(buildName, "NEW", now.format('YYYY-MM-DDTHH:mm:ss'), apiEnvironment.environmentByName.id);
  } catch (error) {
    logger.error(`Could not save deployment for project ${projectId}. Message: ${error}`);
  }

  logger.verbose(`${openshiftProject}: Queued build: ${buildName}`)

  const monitorPayload = {
    buildName,
    projectName,
    openshiftProject,
    branchName: branch,
    sha,
    jobConfig,
    deployment: deployment.addDeployment,
  }

  const taskMonitorLogs = await createTaskMonitor('queuedeploy-kubernetes', monitorPayload)

  let logMessage = ''
  if (gitSha) {
    logMessage = `\`${branch}\` (${buildName})`
  } else {
    logMessage = `\`${branch}\``
  }

  sendToLagoonLogs('start', projectName, "", "task:builddeploy-kubernetes:start", {},
    `*[${projectName}]* ${logMessage}`
  )

}

const deathHandler = async (msg, lastError) => {
  const {
    projectName,
    branchName: branch,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branch}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branch}\``
  }

  sendToLagoonLogs('error', projectName, "", "task:builddeploy-kubernetes:error",  {},
`*[${projectName}]* ${logMessage} ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const {
    projectName,
    branch,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branch}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branch}\``
  }

  sendToLagoonLogs('warn', projectName, "", "task:builddeploy-kubernetes:retry", {error: error.message, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${projectName}]* ${logMessage} ERROR:
\`\`\`
${error}
\`\`\`
Retrying deployment in ${retryExpirationSecs} secs`
  )
}
consumeTasks('builddeploy-kubernetes', messageConsumer, retryHandler, deathHandler)
