import { promisify } from 'util';
import OpenShiftClient from 'openshift-client';
import sleep from 'es7-sleep';
import R from 'ramda';
import sha1 from 'sha1';
import crypto from 'crypto';
import { logger } from '@lagoon/commons/dist/local-logging';
import { getOpenShiftInfoForProject, addOrUpdateEnvironment, getEnvironmentByName, addDeployment, getBillingGroupForProject } from '@lagoon/commons/dist/api';

import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { consumeTasks, initSendToLagoonTasks, createTaskMonitor } from '@lagoon/commons/dist/tasks';

initSendToLagoonLogs();
initSendToLagoonTasks();

const CI = process.env.CI || "false"
const lagoonGitSafeBranch = process.env.LAGOON_GIT_SAFE_BRANCH || "master"
const lagoonVersion = process.env.LAGOON_VERSION
const overwriteOcBuildDeployDindImage = process.env.OVERWRITE_OC_BUILD_DEPLOY_DIND_IMAGE
const NativeCronPodMinimumFrequency = process.env.NATIVE_CRON_POD_MINIMUM_FREQUENCY || "15"
const lagoonEnvironmentType = process.env.LAGOON_ENVIRONMENT_TYPE || "development"
const jwtSecret = process.env.JWTSECRET || "super-secret-string"

const messageConsumer = async msg => {
  const {
    projectName,
    branchName,
    sha,
    type,
    headBranchName,
    headSha,
    baseBranchName,
    baseSha,
    pullrequestTitle,
    promoteSourceEnvironment,
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received DeployOpenshift task for project: ${projectName}, branch: ${branchName}, sha: ${sha}`);

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project
  const billingGroupResult = await getBillingGroupForProject(projectName);
  const projectBillingGroup = billingGroupResult.project

  const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

  try {
    var safeBranchName = ocsafety(branchName)
    var safeProjectName = ocsafety(projectName)


    var overlength = 58 - safeProjectName.length;
    if ( safeBranchName.length > overlength ) {
      var hash = sha1(safeBranchName).substring(0,4)

      safeBranchName = safeBranchName.substring(0, overlength-5)
      safeBranchName = safeBranchName.concat('-' + hash)
    }

    // if we get this far, assume we already passed the point of if the environment can be deployed,
    // so default to development, and change to production based on the same conditions as in commons/dist/tasks.js
    var environmentType = 'development'
    if (
      projectOpenShift.productionEnvironment === branchName
      || projectOpenShift.standbyProductionEnvironment === branchName
    ) {
      environmentType = 'production'
    }
    var gitSha = sha as string
    var projectId = projectOpenShift.id
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(/\/$/, "");
    var openshiftToken = projectOpenShift.openshift.token || ""
    var openshiftProject = projectOpenShift.openshiftProjectPattern ? projectOpenShift.openshiftProjectPattern.replace('${branch}',safeBranchName).replace('${project}', safeProjectName) : `${safeProjectName}-${safeBranchName}`
    var openshiftName = projectOpenShift.openshift.name
    var openshiftProjectUser = projectOpenShift.openshift.projectUser || ""
    var deployPrivateKey = projectOpenShift.privateKey
    var gitUrl = projectOpenShift.gitUrl
    var projectProductionEnvironment = projectOpenShift.productionEnvironment
    var projectStandbyEnvironment = projectOpenShift.standbyProductionEnvironment
    var subfolder = projectOpenShift.subfolder || ""
    var routerPattern = projectOpenShift.openshift.routerPattern ? projectOpenShift.openshift.routerPattern.replace('${branch}',safeBranchName).replace('${project}', safeProjectName) : ""
    var prHeadBranchName = headBranchName || ""
    var prHeadSha = headSha || ""
    var prBaseBranchName = baseBranchName || ""
    var prBaseSha = baseSha || ""
    var prPullrequestTitle = pullrequestTitle || ""
    var graphqlEnvironmentType = environmentType.toUpperCase()
    var graphqlGitType = type.toUpperCase()
    var openshiftPromoteSourceProject = promoteSourceEnvironment ? `${safeProjectName}-${ocsafety(promoteSourceEnvironment)}` : ""
        // A secret which is the same across all Environments of this Lagoon Project
    var projectSecret = crypto.createHash('sha256').update(`${projectName}-${jwtSecret}`).digest('hex');
    var alertContactHA = ""
    var alertContactSA = ""
    var uptimeRobotStatusPageIds = []
    var monitoringConfig = ""
    try {
      monitoringConfig = JSON.parse(projectOpenShift.openshift.monitoringConfig)
    } catch (e) {
      logger.error('Error parsing openshift.monitoringConfig from openshift: %s, continuing with "invalid"', projectOpenShift.openshift.name, { error: e })
      monitoringConfig = "invalid"
    }
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
  switch (type) {
    case "branch":
      // if we have a sha given, we use that, if not we fall back to the branch (which needs be prefixed by `origin/`
      var gitRef = gitSha ? gitSha : `origin/${branchName}`
      var deployBaseRef = branchName
      var deployHeadRef = null
      var deployTitle = null
      break;

    case "pullrequest":
      var gitRef = gitSha
      var deployBaseRef = prBaseBranchName
      var deployHeadRef = prHeadBranchName
      var deployTitle = prPullrequestTitle
      break;

    case "promote":
      var gitRef = `origin/${promoteSourceEnvironment}`
      var deployBaseRef = promoteSourceEnvironment
      var deployHeadRef = null
      var deployTitle = null
      break;
  }


  // Generates a buildconfig object
  const buildconfig = (resourceVersion, secret, type, environment: any = {}) => {

    let buildFromImage = {}
    // During CI we want to use the OpenShift Registry for our build Image and use the OpenShift registry for the base Images
    if (CI == "true") {
      buildFromImage = {
        "kind": "DockerImage",
        "name": `172.17.0.1:5000/lagoon/oc-build-deploy-dind:latest`,
      }
    } else if (overwriteOcBuildDeployDindImage) {
      // allow to overwrite the image we use via OVERWRITE_OC_BUILD_DEPLOY_DIND_IMAGE env variable
      buildFromImage = {
        "kind": "DockerImage",
        "name": overwriteOcBuildDeployDindImage,
      }
    } else if (lagoonEnvironmentType == 'production') {
      // we are a production environment, use the amazeeio/ image with our current lagoon version
      buildFromImage = {
        "kind": "DockerImage",
        "name": `amazeeio/oc-build-deploy-dind:${lagoonVersion}`,
      }
    } else {
      // we are a development enviornment, use the amazeeiolagoon image with the same branch name
      buildFromImage = {
        "kind": "DockerImage",
        "name": `amazeeiolagoon/oc-build-deploy-dind:${lagoonGitSafeBranch}`,
      }
    }

    let buildconfig = {
      "apiVersion": "v1",
      "kind": "BuildConfig",
      "metadata": {
          "creationTimestamp": null,
          "name": "lagoon",
          "resourceVersion": resourceVersion
      },
      "spec": {
          "nodeSelector": null,
          "postCommit": {},
          "resources": {},
          "runPolicy": "SerialLatestOnly",
          "successfulBuildsHistoryLimit": 1,
          "failedBuildsHistoryLimit": 1,
          "source": {
              "git": {
                  "uri": gitUrl
              },
              "type": "Git"
          },
          "strategy": {
              "customStrategy": {
                  "secrets": [
                      {
                          "secretSource": {
                              "name": secret
                          },
                          "mountPath": "/var/run/secrets/lagoon/deployer"
                      },
                      {
                        "secretSource": {
                            "name": "lagoon-sshkey"
                        },
                        "mountPath": "/var/run/secrets/lagoon/ssh"
                    }
                  ],
                  "env": [
                      {
                          "name": "TYPE",
                          "value": type
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
                          "name": "SAFE_BRANCH",
                          "value": safeBranchName
                      },
                      {
                          "name": "BRANCH",
                          "value": branchName
                      },
                      {
                          "name": "SAFE_PROJECT",
                          "value": safeProjectName
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
                          "name": "OPENSHIFT_NAME",
                          "value": openshiftName
                      },
                      {
                          "name": "PROJECT_SECRET",
                          "value": projectSecret
                      },
                      {
                        "name": "NATIVE_CRON_POD_MINIMUM_FREQUENCY",
                        "value": NativeCronPodMinimumFrequency
                      }
                  ],
                  "forcePull": true,
                  "from": buildFromImage,
              },
              "type": "Custom"
          }
      }
    }
    if (CI == "true") {
      buildconfig.spec.strategy.customStrategy.env.push({"name": "CI","value": CI})
    }
    if (type == "pullrequest") {
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PR_HEAD_BRANCH","value": prHeadBranchName})
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PR_HEAD_SHA","value": prHeadSha})
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PR_BASE_BRANCH","value": prBaseBranchName})
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PR_BASE_SHA","value": prBaseSha})
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PR_TITLE","value": prPullrequestTitle})
    }
    if (type == "promote") {
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PROMOTION_SOURCE_ENVIRONMENT","value": promoteSourceEnvironment})
      buildconfig.spec.strategy.customStrategy.env.push({"name": "PROMOTION_SOURCE_OPENSHIFT_PROJECT","value": openshiftPromoteSourceProject})
    }
    if (!R.isEmpty(projectOpenShift.envVariables)) {
      buildconfig.spec.strategy.customStrategy.env.push({"name": "LAGOON_PROJECT_VARIABLES", "value": JSON.stringify(projectOpenShift.envVariables)})
    }
    if (!R.isEmpty(environment.envVariables)) {
      buildconfig.spec.strategy.customStrategy.env.push({"name": "LAGOON_ENVIRONMENT_VARIABLES", "value": JSON.stringify(environment.envVariables)})
    }
    if (alertContactHA != undefined && alertContactSA != undefined){
      if (availability == "HIGH") {
        buildconfig.spec.strategy.customStrategy.env.push({"name": "MONITORING_ALERTCONTACT","value": alertContactHA})
      } else {
        buildconfig.spec.strategy.customStrategy.env.push({"name": "MONITORING_ALERTCONTACT","value": alertContactSA})
      }
    } else {
      buildconfig.spec.strategy.customStrategy.env.push({"name": "MONITORING_ALERTCONTACT","value": "unconfigured"})
    }
    if (uptimeRobotStatusPageId){
      buildconfig.spec.strategy.customStrategy.env.push({"name": "MONITORING_STATUSPAGEID","value": uptimeRobotStatusPageId})
    }
    return buildconfig
  }

  // OpenShift API object
  const openshift = new OpenShiftClient.OApi({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetes = new OpenShiftClient.Core({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });


  // openshift-client does not know about the OpenShift Resources, let's teach it.
  openshift.ns.addResource('buildconfigs');
  openshift.ns.addResource('rolebindings');
  openshift.addResource('projectrequests');

  // If we should promote, first check if the source project does exist
  if (type == "promote") {
    try {
      const promotionSourceProjectsGet = promisify(openshift.projects(openshiftPromoteSourceProject).get)
      await promotionSourceProjectsGet()
      logger.info(`${openshiftProject}: Promotion Source Project ${openshiftPromoteSourceProject} exists, continuing`)
    } catch (err) {
      const error = `${openshiftProject}: Promotion Source Project ${openshiftPromoteSourceProject} does not exists, ${err}`
      logger.error(error)
      throw new Error(error)
    }
  }

  // Create a new Project if it does not exist
  let projectStatus = {}
  try {
    const projectsGet = promisify(openshift.projects(openshiftProject).get)
    projectStatus = await projectsGet()
    logger.info(`${openshiftProject}: Project ${openshiftProject} already exists, continuing`)
  } catch (err) {
    // a non existing project also throws an error, we check if it's a 404, means it does not exist, so we create it.
    if (err.code == 404 || err.code == 403) {
      logger.info(`${openshiftProject}: Project ${openshiftProject}  does not exist, creating`)
      const projectrequestsPost = promisify(openshift.projectrequests.post)
      // @ts-ignore
      await projectrequestsPost({
        body: {
          "apiVersion":"v1",
          "kind":"ProjectRequest",
          "metadata": {
            "name":openshiftProject,
            "labels": {
              "lagoon.sh/project": safeProjectName,
              "lagoon.sh/environment": safeBranchName,
              "lagoon.sh/environmentType": environmentType
            }
          },
          "displayName":`[${projectName}] ${branchName}`
        } });
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Update GraphQL API with information about this environment
  let environment;
  try {
    environment = await addOrUpdateEnvironment(branchName, projectId, graphqlGitType, deployBaseRef, graphqlEnvironmentType, openshiftProject, deployHeadRef, deployTitle)
    logger.info(`${openshiftProject}: Created/Updated Environment in API`)
  } catch (err) {
    logger.error(err)
    throw new Error
  }

  // Used to create RoleBindings
  const rolebindingsPost = promisify(openshift.ns(openshiftProject).rolebindings.post)


  // If a project user is given, give it access to our project.
  if (openshiftProjectUser) {
    try {
      const rolebindingsGet = promisify(openshift.ns(openshiftProject).rolebindings(`${openshiftProjectUser}-edit`).get)
      await rolebindingsGet()
      logger.info(`${openshiftProject}: RoleBinding ${openshiftProjectUser}-edit already exists, continuing`)
    } catch (err) {
      if (err.code == 404) {
        logger.info(`${openshiftProject}: RoleBinding ${openshiftProjectUser}-edit does not exists, creating`)
        // @ts-ignore
        await rolebindingsPost({ body: {"kind":"RoleBinding","apiVersion":"v1","metadata":{"name":`${openshiftProjectUser}-edit`,"namespace":openshiftProject},"roleRef":{"name":"edit"},"subjects":[{"name":openshiftProjectUser,"kind":"User","namespace":openshiftProject}]}})
      } else {
        logger.error(err)
        throw new Error
      }
    }
  }

  // Create ServiceAccount if it does not exist yet.
  try {
    const serviceaccountsGet = promisify(kubernetes.ns(openshiftProject).serviceaccounts('lagoon-deployer').get)
    projectStatus = await serviceaccountsGet()
    logger.info(`${openshiftProject}: ServiceAccount lagoon-deployer already exists, continuing`)
  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject}: ServiceAccount lagoon-deployer does not exists, creating`)
      const serviceaccountsPost = promisify(kubernetes.ns(openshiftProject).serviceaccounts.post)
      // @ts-ignore
      await serviceaccountsPost({ body: {"kind":"ServiceAccount","apiVersion":"v1","metadata":{"name":"lagoon-deployer"} }})
      await sleep(2000); // sleep a bit after creating the ServiceAccount for OpenShift to create all the secrets
      // @ts-ignore
      await rolebindingsPost({ body: {"kind":"RoleBinding","apiVersion":"v1","metadata":{"name":"lagoon-deployer-admin","namespace":openshiftProject},"roleRef":{"name":"admin"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]}})
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Give the ServiceAccount access to the Promotion Source Project, it needs two roles: 'view' and 'system:image-puller' and
  // give the ServiceAccount 'default' access to the Promotion Source Project, it needs role: 'system:image-puller'
  if (type == "promote") {
    try {
      const promotionSourcRolebindingsGet = promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings(`${openshiftProject}-lagoon-deployer-view`).get)
      await promotionSourcRolebindingsGet()
      logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-view in ${openshiftPromoteSourceProject} does already exist, continuing`)
    } catch (err) {
      if (err.code == 404) {
        logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-view in ${openshiftPromoteSourceProject} does not exists, creating`)
        const promotionSourceRolebindingsPost = promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings.post)
        // @ts-ignore
        await promotionSourceRolebindingsPost({ body: {"kind":"RoleBinding","apiVersion":"v1","metadata":{"name":`${openshiftProject}-lagoon-deployer-view`,"namespace":openshiftPromoteSourceProject},"roleRef":{"name":"view"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]}})
      } else {
        logger.error(err)
        throw new Error
      }
    }
    try {
      const promotionSourceRolebindingsGet = promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings(`${openshiftProject}-lagoon-deployer-image-puller`).get)
      await promotionSourceRolebindingsGet()
      logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-image-puller in ${openshiftPromoteSourceProject} does already exist, continuing`)
    } catch (err) {
      if (err.code == 404) {
        logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-image-puller in ${openshiftPromoteSourceProject} does not exists, creating`)
        const promotionSourceRolebindingsPost = promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings.post)
        // @ts-ignore
        await promotionSourceRolebindingsPost({ body: {"kind":"RoleBinding","apiVersion":"v1","metadata":{"name":`${openshiftProject}-lagoon-deployer-image-puller`,"namespace":openshiftPromoteSourceProject},"roleRef":{"name":"system:image-puller"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]}})
      } else {
        logger.error(err)
        throw new Error
      }
    }
    try {
      const promotionSourceRolebindingsGet = promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings(`${openshiftProject}-lagoon-default-image-puller`).get)
      await promotionSourceRolebindingsGet()
      logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-default-image-puller in ${openshiftPromoteSourceProject} does already exist, continuing`)
    } catch (err) {
      if (err.code == 404) {
        logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-default-image-puller in ${openshiftPromoteSourceProject} does not exists, creating`)
        const promotionSourceRolebindingsPost = promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings.post)
        // @ts-ignore
        await promotionSourceRolebindingsPost({ body: {"kind":"RoleBinding","apiVersion":"v1","metadata":{"name":`${openshiftProject}-lagoon-default-image-puller`,"namespace":openshiftPromoteSourceProject},"roleRef":{"name":"system:image-puller"},"subjects":[{"name":"default","kind":"ServiceAccount","namespace":openshiftProject}]}})
      } else {
        logger.error(err)
        throw new Error
      }
    }
  }

  // Create SSH Key Secret if not exist yet, if it does update it.
  let sshKey = {}
  const sshKeyBase64 = new Buffer(deployPrivateKey.replace(/\\n/g, "\n")).toString('base64')
  try {
    const secretsGet = promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').get)
    sshKey = await secretsGet()
    logger.info(`${openshiftProject}: Secret lagoon-sshkey already exists, updating`)
    const secretsPut = promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').put)
    // @ts-ignore
    await secretsPut({ body: {"apiVersion":"v1","kind":"Secret","metadata":{"name":"lagoon-sshkey", "resourceVersion": sshKey.metadata.resourceVersion },"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})
  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject}: Secret lagoon-sshkey does not exists, creating`)
      const secretsPost = promisify(kubernetes.ns(openshiftProject).secrets.post)
      // @ts-ignore
      await secretsPost({ body: {"apiVersion":"v1","kind":"Secret","metadata":{"name":"lagoon-sshkey"},"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Load the Token Secret Name for our created ServiceAccount
  const serviceaccountsGet = promisify(kubernetes.ns(openshiftProject).serviceaccounts("lagoon-deployer").get)
  const serviceaccount: any = await serviceaccountsGet()
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

  // Create or update the BuildConfig
  try {
    const buildConfigsGet = promisify(openshift.ns(openshiftProject).buildconfigs('lagoon').get)
    const currentBuildConfig = await buildConfigsGet()
    logger.info(`${openshiftProject}: Buildconfig lagoon already exists, updating`)
    const buildConfigsPut = promisify(openshift.ns(openshiftProject).buildconfigs('lagoon').put)
    // The OpenShift API needs the current resource Version so it knows that we're updating data of the last known version. This is filled within currentBuildConfig.metadata.resourceVersion
    // @ts-ignore
    await buildConfigsPut({ body: buildconfig(currentBuildConfig.metadata.resourceVersion, serviceaccountTokenSecret, type, environment.addOrUpdateEnvironment) })
  } catch (err) {
    // Same as for projects, if BuildConfig does not exist, it throws an error and we check the error is an 404 and with that we know it does not exist.
    if (err.code == 404) {
      logger.info(`${openshiftProject}: Buildconfig lagoon does not exist, creating`)
      const buildConfigsPost = promisify(openshift.ns(openshiftProject).buildconfigs.post)
      // This is a complete new BuildConfig, so the resource version is "0" (it will be updated automatically by OpenShift)
      // @ts-ignore
      await buildConfigsPost({ body: buildconfig("0", serviceaccountTokenSecret, type, environment.addOrUpdateEnvironment) })
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Instantiate = Create a new Build from an existing BuildConfig
  const buildConfigsInstantiatePost = promisify(openshift.ns(openshiftProject).buildconfigs('lagoon/instantiate').post)
  // @ts-ignore
  const build = await buildConfigsInstantiatePost({body: {"kind":"BuildRequest","apiVersion":"v1","metadata":{"name":"lagoon"}}})
  const buildName = build.metadata.name

  try {
    const convertDateFormat = R.init;
    const apiEnvironment = await getEnvironmentByName(branchName, projectId);
    await addDeployment(buildName, build.status.phase.toUpperCase(), convertDateFormat(build.metadata.creationTimestamp), apiEnvironment.environmentByName.id, build.metadata.uid);
  } catch (error) {
    logger.error(`Could not save deployment for project ${projectId}, build ${buildName}. Message: ${error}`);
  }

  logger.verbose(`${openshiftProject}: Running build: ${buildName}`)

  const monitorPayload = {
    buildName: buildName,
    projectName: projectName,
    openshiftProject: openshiftProject,
    branchName: branchName,
    sha: sha
  }

  const taskMonitorLogs = await createTaskMonitor('builddeploy-openshift', monitorPayload)

  let logMessage = ''
  if (gitSha) {
    logMessage = `\`${branchName}\` (${buildName})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToLagoonLogs('start', projectName, "", "task:builddeploy-openshift:start", {},
    `*[${projectName}]* ${logMessage}`
  )

}

const deathHandler = async (msg, lastError) => {
  const {
    projectName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToLagoonLogs('error', projectName, "", "task:builddeploy-openshift:error",  {},
`*[${projectName}]* ${logMessage} ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const {
    projectName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToLagoonLogs('warn', projectName, "", "task:builddeploy-openshift:retry", {error: error.message, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${projectName}]* ${logMessage} ERROR:
\`\`\`
${error}
\`\`\`
Retrying deployment in ${retryExpirationSecs} secs`
  )
}
consumeTasks('builddeploy-openshift', messageConsumer, retryHandler, deathHandler)
