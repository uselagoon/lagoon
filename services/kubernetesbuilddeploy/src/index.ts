import ApiClient from 'kubernetes-client';
import sleep from "es7-sleep";
import R from 'ramda';
import sha1 from 'sha1';
import crypto from 'crypto';
import { logger } from '@lagoon/commons/src/local-logging';
import { getOpenShiftInfoForProject, addOrUpdateEnvironment, getEnvironmentByName, addDeployment } from '@lagoon/commons/src/api';
import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/src/logs';
import { consumeTasks, initSendToLagoonTasks, createTaskMonitor } from '@lagoon/commons/src/tasks';

initSendToLagoonLogs();
initSendToLagoonTasks();

const CI = process.env.CI || "false"
const lagoonGitSafeBranch = process.env.LAGOON_GIT_SAFE_BRANCH || "master"
const lagoonVersion = process.env.LAGOON_VERSION
const overwriteKubectlBuildDeployDindImage = process.env.OVERWRITE_KUBECTL_BUILD_DEPLOY_DIND_IMAGE
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

  logger.verbose(`Received DeployKubernetes task for project: ${projectName}, branch: ${branchName}, sha: ${sha}`);

  const result: any = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project

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

    var environmentType = branchName === projectOpenShift.productionEnvironment ? 'production' : 'development';
    var gitSha = sha
    var projectId = projectOpenShift.id
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(/\/$/, "");
    var openshiftToken = projectOpenShift.openshift.token || ""
    var openshiftProject = projectOpenShift.openshiftProjectPattern ? projectOpenShift.openshiftProjectPattern.replace('${branch}',safeBranchName).replace('${project}', safeProjectName) : `${safeProjectName}-${safeBranchName}`
    var openshiftName = projectOpenShift.openshift.name
    var openshiftProjectUser = projectOpenShift.openshift.projectUser || ""
    var deployPrivateKey = projectOpenShift.privateKey
    var gitUrl = projectOpenShift.gitUrl
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
  } catch(error) {
    logger.error(`Error while loading information for project ${projectName}`)
    logger.error(error)
    throw(error)
  }

  let gitRef = '';
  // Deciding which git REF we would like deployed
  switch (type) {
    case "branch":
      // if we have a sha given, we use that, if not we fall back to the branch (which needs be prefixed by `origin/`
      gitRef = gitSha ? gitSha : `origin/${branchName}`
      var deployBaseRef = branchName
      var deployHeadRef = null
      var deployTitle = null
      break;

    case "pullrequest":
      gitRef = gitSha
      var deployBaseRef = prBaseBranchName
      var deployHeadRef = prHeadBranchName
      var deployTitle = prPullrequestTitle
      break;

    case "promote":
      gitRef = `origin/${promoteSourceEnvironment}`
      var deployBaseRef = promoteSourceEnvironment
      var deployHeadRef = null
      var deployTitle = null
      break;
  }


  // Generates a jobconfig object
  const generateJobConfig = (buildName, secret, type, environment: { [key: string]: any } = {}) => {

    let buildImage = {}
    // During CI we want to use the OpenShift Registry for our build Image and use the OpenShift registry for the base Images
    if (CI == "true") {
      buildImage = "oc-build-deploy-dind:latest"
    } else if (overwriteKubectlBuildDeployDindImage) {
      // allow to overwrite the image we use via OVERWRITE_OC_BUILD_DEPLOY_DIND_IMAGE env variable
      buildImage = overwriteKubectlBuildDeployDindImage
    } else if (lagoonEnvironmentType == 'production') {
      // we are a production environment, use the amazeeio/ image with our current lagoon version
      buildImage = `amazeeio/oc-build-deploy-dind:${lagoonVersion}`
    } else {
      // we are a development enviornment, use the amazeeiolagoon image with the same branch name
      buildImage = `amazeeiolagoon/oc-build-deploy-dind:${lagoonGitSafeBranch}`
    }

    let jobconfig = {
      "apiVersion": "batch/v1",
      "kind": "Job",
      "metadata": {
          "creationTimestamp": null,
          "name": buildName,
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
            "containers": [
              {
                "name": "lagoon-build",
                "image": buildImage,
                "imagePullPolicy": "IfNotPresent",
                "env": [
                  {
                      "name": "TYPE",
                      "value": type
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
                      "name": "OPENSHIFT_NAME",
                      "value": openshiftName
                  },
                  {
                      "name": "PROJECT_SECRET",
                      "value": projectSecret
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
    if (type == "pullrequest") {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_HEAD_BRANCH","value": prHeadBranchName})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_HEAD_SHA","value": prHeadSha})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_BASE_BRANCH","value": prBaseBranchName})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_BASE_SHA","value": prBaseSha})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PR_TITLE","value": prPullrequestTitle})
    }
    if (type == "promote") {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PROMOTION_SOURCE_ENVIRONMENT","value": promoteSourceEnvironment})
      jobconfig.spec.template.spec.containers[0].env.push({"name": "PROMOTION_SOURCE_NAMESPACE","value": openshiftPromoteSourceProject})
    }
    if (!R.isEmpty(projectOpenShift.envVariables)) {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "LAGOON_PROJECT_VARIABLES", "value": JSON.stringify(projectOpenShift.envVariables)})
    }
    if (!R.isEmpty(environment.envVariables)) {
      jobconfig.spec.template.spec.containers[0].env.push({"name": "LAGOON_ENVIRONMENT_VARIABLES", "value": JSON.stringify(environment.envVariables)})
    }
    return jobconfig
  }

  const Client = ApiClient.Client1_13;

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetes = new Client({ 
    config: {
      url: openshiftConsole,
      insecureSkipTlsVerify: true,
      auth: {
        bearer: openshiftToken
      },
    }
  });

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  // const kubernetesApi = new KubernetesClient.Api({
  //   url: openshiftConsole,
  //   insecureSkipTlsVerify: true,
  //   auth: {
  //     bearer: openshiftToken
  //   },
  // });

  // kubernetes-client does not know about the OpenShift Resources, let's teach it.
  // kubernetes.ns.addResource('rolebindings');

  // // If we should promote, first check if the source project does exist
  // if (type == "promote") {
  //   try {
  //     const promotionSourceProjectsGet = Promise.promisify(openshift.projects(openshiftPromoteSourceProject).get, { context: openshift.projects(openshiftPromoteSourceProject) })
  //     await promotionSourceProjectsGet()
  //     logger.info(`${openshiftProject}: Promotion Source Project ${openshiftPromoteSourceProject} exists, continuing`)
  //   } catch (err) {
  //     const error = `${openshiftProject}: Promotion Source Project ${openshiftPromoteSourceProject} does not exists, ${err}`
  //     logger.error(error)
  //     throw new Error(error)
  //   }
  // }


  // Create a new Namespace if it does not exist
  try {
    const body = { apiVersion:"v1", kind:"Namespace", metadata: { name: openshiftProject } };
    await kubernetes.api.v1.namespace.post({ body });
    logger.info(`${openshiftProject}: Namespace ${openshiftProject} created`)
  } catch (err) {
    console.log(err.code)
    // An already existing namespace throws an error, we check if it's a 409, means it does already exist, so we ignore that error.
    if (err.code == 409) {
      logger.info(`${openshiftProject}: Namespace ${openshiftProject} already exists`)
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


  // Create ServiceAccount if it does not exist yet.
  try {
    logger.info(`${openshiftProject}: Check if ServiceAccount lagoon-deployer already exists`)

    // const serviceaccountsGet = Bluebird.Promise.promisify(kubernetes.ns(openshiftProject).serviceaccounts('lagoon-deployer').get, { context: kubernetes.ns(openshiftProject).serviceaccounts('lagoon-deployer') })
    const result = await kubernetes.api.v1.namespaces(openshiftProject).serviceaccounts('lagoon-deployer').get();

    // const projectStatus = await serviceaccountsGet()
    logger.info(`${openshiftProject}: ServiceAccount lagoon-deployer already exists, continuing`)
  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject}: ServiceAccount lagoon-deployer does not exists, creating`)
      const serviceAccountsPost = await kubernetes.api.v1.namespaces(openshiftProject).serviceaccounts.post({ body: {"kind":"ServiceAccount","metadata":{"name":"lagoon-deployer"} }})

      // const serviceaccountsPost = Bluebird.Promise.promisify(kubernetes.ns(openshiftProject).serviceaccounts.post, { context: kubernetes.ns(openshiftProject).serviceaccounts })
      // await serviceaccountsPost({ body: {"kind":"ServiceAccount","metadata":{"name":"lagoon-deployer"} }})
      await sleep(2000); // sleep a bit after creating the ServiceAccount for Kubernetes to create all the secrets

      const serviceaccountsRolebindingsBody = {"kind":"RoleBinding","apiVersion":"rbac.authorization.k8s.io/v1","metadata":{"name":"lagoon-deployer-admin","namespace":openshiftProject},"roleRef":{"name":"admin","kind":"ClusterRole","apiGroup":"rbac.authorization.k8s.io"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]};
      const serviceAccountsRoleBindingsPost = await kubernetes.apis["rbac.authorization.k8s.io"].v1alpha1.clusterrolebindings.post(serviceaccountsRolebindingsBody)

      // const serviceaccountsRolebindingsPost = Bluebird.Promise.promisify(kubernetesApi.group(serviceaccountsRolebindingsBody).ns(openshiftProject).rolebindings.post, { context: kubernetesApi.group(serviceaccountsRolebindingsBody).ns(openshiftProject).rolebindings })
      // await serviceaccountsRolebindingsPost({ body: serviceaccountsRolebindingsBody })

    } else {
      logger.error(err)
      throw new Error
    }
  }

  // // Give the ServiceAccount access to the Promotion Source Project, it needs two roles: 'view' and 'system:image-puller'
  // if (type == "promote") {
  //   try {
  //     const promotionSourcRolebindingsGet = Promise.promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings(`${openshiftProject}-lagoon-deployer-view`).get, { context: openshift.ns(openshiftProject).rolebindings(`${openshiftProject}-lagoon-deployer-view`) })
  //     await promotionSourcRolebindingsGet()
  //     logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-view in ${openshiftPromoteSourceProject} does already exist, continuing`)
  //   } catch (err) {
  //     if (err.code == 404) {
  //       logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-view in ${openshiftPromoteSourceProject} does not exists, creating`)
  //       const promotionSourceRolebindingsPost = Promise.promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings.post, { context: openshift.ns(openshiftPromoteSourceProject).rolebindings })
  //       await promotionSourceRolebindingsPost({ body: {"kind":"RoleBinding","metadata":{"name":`${openshiftProject}-lagoon-deployer-view`,"namespace":openshiftPromoteSourceProject},"roleRef":{"name":"view"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]}})
  //     } else {
  //       logger.error(err)
  //       throw new Error
  //     }
  //   }
  //   try {
  //     const promotionSourceRolebindingsGet = Promise.promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings(`${openshiftProject}-lagoon-deployer-image-puller`).get, { context: openshift.ns(openshiftProject).rolebindings(`${openshiftProject}-lagoon-deployer-image-puller`) })
  //     await promotionSourceRolebindingsGet()
  //     logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-image-puller in ${openshiftPromoteSourceProject} does already exist, continuing`)
  //   } catch (err) {
  //     if (err.code == 404) {
  //       logger.info(`${openshiftProject}: RoleBinding ${openshiftProject}-lagoon-deployer-image-puller in ${openshiftPromoteSourceProject} does not exists, creating`)
  //       const promotionSourceRolebindingsPost = Promise.promisify(openshift.ns(openshiftPromoteSourceProject).rolebindings.post, { context: openshift.ns(openshiftPromoteSourceProject).rolebindings })
  //       await promotionSourceRolebindingsPost({ body: {"kind":"RoleBinding","metadata":{"name":`${openshiftProject}-lagoon-deployer-image-puller`,"namespace":openshiftPromoteSourceProject},"roleRef":{"name":"system:image-puller"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]}})
  //     } else {
  //       logger.error(err)
  //       throw new Error
  //     }
  //   }
  // }

  // Create SSH Key Secret if not exist yet, if it does update it.
  let sshKey: {[type:string]: any} = {}
  const sshKeyBase64 = new Buffer(deployPrivateKey.replace(/\\n/g, "\n")).toString('base64')
  try {
    logger.info(`${openshiftProject}: Check if secret lagoon-sshkey exists`)


    sshKey = kubernetes.api.v1.namespaces(openshiftProject).secrets.get('lagoon-sshkey');
    // const secretsGet = Bluebird.Promise.promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').get, { context: kubernetes.ns(openshiftProject).secrets('lagoon-sshkey') })
    // sshKey = await secretsGet()

    logger.info(`${openshiftProject}: Secret lagoon-sshkey already exists, updating`)


    const secretBody = { body: {"kind":"Secret","metadata":{"name":"lagoon-sshkey", "resourceVersion": sshKey.metadata.resourceVersion },"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}};
    const secretsPut = kubernetes.api.v1.namespaces(openshiftProject).secrets('lagoon-sshkey').put(secretBody)
    // const secretsPut = Bluebird.Promise.promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').put, { context: kubernetes.ns(openshiftProject).secrets('lagoon-sshkey') })
    // await secretsPut(secretBody)

  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject}: Secret lagoon-sshkey does not exists, creating`)

      const secretBody = { body: {"kind":"Secret","metadata":{"name":"lagoon-sshkey"},"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}};
      const secretsPut = kubernetes.api.v1.namespaces(openshiftProject).secrets('lagoon-sshkey').put(secretBody)

      // const secretsPost = Bluebird.Promise.promisify(kubernetes.ns(openshiftProject).secrets.post, { context: kubernetes.ns(openshiftProject).secrets })
      // await secretsPost({ body: {"kind":"Secret","metadata":{"name":"lagoon-sshkey"},"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})

    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Load the Token Secret Name for our created ServiceAccount


  const serviceAccount = kubernetes.api.v1.namespaces(openshiftProject).get()
  // const serviceaccountsGet = Bluebird.Promise.promisify(kubernetes.ns(openshiftProject).serviceaccounts("lagoon-deployer").get, { context: kubernetes.ns(openshiftProject).serviceaccounts("lagoon-deployer") })
  // const serviceaccount: {[key:string]: any} = await serviceaccountsGet()


  // a ServiceAccount can have multiple secrets, we are interested in one that has starts with 'lagoon-deployer-token'
  let serviceaccountTokenSecret = '';
  for (var key in serviceAccount.secrets) {
    if(/^lagoon-deployer-token/.test(serviceAccount.secrets[key].name)) {
      serviceaccountTokenSecret = serviceAccount.secrets[key].name
      break;
    }
  }
  if (serviceaccountTokenSecret == '') {
    throw new Error(`${openshiftProject}: Could not find token secret for ServiceAccount lagoon-deployer`)
  }

  // Create Job
  let job: {[key:string]: any} = {};
  try {

    // @TODO: generate names with incremential numbers from the previous build number
    const buildName = `lagoon-build-${Math.random().toString(36).substring(7)}`;
    const jobConfig = generateJobConfig(buildName, serviceaccountTokenSecret, type, environment.addOrUpdateEnvironment);


    const jobPost = await kubernetes.apis.batch.v1.namespaces(openshiftProject).jobs.post(jobConfig);
    // const jobPost = Bluebird.Promise.promisify(kubernetesApi.group(jobConfig).ns(openshiftProject).jobs.post, { context: kubernetesApi.group(jobConfig).ns(openshiftProject).jobs })
    // job = await jobPost({ body: jobConfig })

    logger.info(`${openshiftProject}: Created job`)
  } catch (err) {
    logger.error(err)
    throw new Error
  }

  const jobName = job.metadata.name

  try {
    const convertDateFormat = R.init;
    const apiEnvironment: any = await getEnvironmentByName(branchName, projectId);
    await addDeployment(jobName, "RUNNING", convertDateFormat(job.metadata.creationTimestamp), apiEnvironment.environmentByName.id, job.metadata.uid);
  } catch (error) {
    logger.error(`Could not save deployment for project ${projectId}, job ${jobName}. Message: ${error}`);
  }

  logger.verbose(`${openshiftProject}: Running build: ${jobName}`)

  const monitorPayload = {
    buildName: jobName,
    projectName: projectName,
    openshiftProject: openshiftProject,
    branchName: branchName,
    sha: sha
  }

  const taskMonitorLogs = await createTaskMonitor('builddeploy-kubernetes', monitorPayload)

  let logMessage = '';
  let buildName = '';
  if (gitSha) {
    logMessage = `\`${branchName}\` (${buildName})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToLagoonLogs('start', projectName, "", "task:builddeploy-kubernetes:start", {},
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
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
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
