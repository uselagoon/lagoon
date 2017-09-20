// @flow

const Promise = require("bluebird");
const Api = require('kubernetes-client');
const sleep = require("es7-sleep");
const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { getOpenShiftInfoForSiteGroup } = require('@amazeeio/lagoon-commons/src/api');

const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { consumeTasks, initSendToAmazeeioTasks, createTaskMonitor } = require('@amazeeio/lagoon-commons/src/tasks');

initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const ocBuildDeployImageLocation = process.env.OC_BUILD_DEPLOY_IMAGE_LOCATION || "dockerhub"
const ciOverrideImageRepo = process.env.CI_OVERRIDE_IMAGE_REPO || ""

const messageConsumer = async msg => {
  const {
    siteGroupName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received DeployOpenshift task for sitegroup: ${siteGroupName}, branch: ${branchName}, sha: ${sha}`);

  const siteGroupOpenShift = await getOpenShiftInfoForSiteGroup(siteGroupName);


  const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

  try {
    var safeBranchName = ocsafety(branchName)
    var safeSiteGroupName = ocsafety(siteGroupName)
    var gitSha = sha
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console.replace(/\/$/, "");
    var openshiftIsAppuio = openshiftConsole === "https://console.appuio.ch" ? true : false
    var openshiftRegistry =siteGroupOpenShift.siteGroup.openshift.registry
    var appuioToken = siteGroupOpenShift.siteGroup.openshift.appuiotoken || ""
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || ""
    var openshiftUsername = siteGroupOpenShift.siteGroup.openshift.username || ""
    var openshiftPassword = siteGroupOpenShift.siteGroup.openshift.password || ""
    var openshiftTemplate = siteGroupOpenShift.siteGroup.openshift.template
    var openshiftFolder = siteGroupOpenShift.siteGroup.openshift.folder || "."
    var openshiftProject = openshiftIsAppuio ? `amze-${safeSiteGroupName}-${safeBranchName}` : `${safeSiteGroupName}-${safeBranchName}`
    var openshiftProjectUser = siteGroupOpenShift.siteGroup.openshift.project_user || ""
    var deployPrivateKey = siteGroupOpenShift.siteGroup.client.deployPrivateKey
    var gitUrl = siteGroupOpenShift.siteGroup.gitUrl
    var routerPattern = siteGroupOpenShift.siteGroup.openshift.router_pattern || "${sitegroup}.${branch}.appuio.amazee.io"
    var openshiftRessourceRouterUrl = routerPattern.replace('${branch}',safeBranchName).replace('${sitegroup}', safeSiteGroupName)

  } catch(error) {
    logger.warn(`Error while loading information for sitegroup ${siteGroupName}: ${error}`)
    throw(error)
  }



  // Deciding which git REF we would like deployed, if we have a sha given, we use that, if not we fall back to the branch (which needs be prefixed by `origin/`)
  var gitRef = gitSha ? gitSha : `origin/${branchName}`


  const buildconfig = (resourceVersion, buildFromImage, secret) => {

    return  {
      "apiVersion": "v1",
      "kind": "BuildConfig",
      "metadata": {
          "creationTimestamp": null,
          "name": "lagoon",
          "resourceVersion": resourceVersion
      },
      "spec": {
          "nodeSelector": null,
          "output": {
              "to": {
                  "kind": "ImageStreamTag",
                  "name": "empty:latest"
              }
          },
          "postCommit": {},
          "resources": {},
          "runPolicy": "Serial",
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
                          "name": "GIT_REF",
                          "value": gitRef
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
                          "name": "SAFE_SITEGROUP",
                          "value": safeSiteGroupName
                      },
                      {
                          "name": "SITEGROUP",
                          "value": siteGroupName
                      },
                      {
                          "name": "CI_OVERRIDE_IMAGE_REPO",
                          "value": "amazeeio"
                      }
                  ],
                  "forcePull": true,
                  "from": buildFromImage,
              },
              "type": "Custom"
          }
      }
    }
  }

  const buildFromImage = {
    "kind": "ImageStreamTag",
    "namespace": "openshift",
    "name": "oc-build-deploy:latest"
  }

  const openshift = new Api.Core({
    url: openshiftConsole,
    path: 'oapi',
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });

  const kubernetes = new Api.Core({
    url: openshiftConsole,
    path: 'api',
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    },
  });


  // kubernetes-client does not know about the OpenShift Resources, let's teach it.
  openshift.ns.addResource('buildconfigs');
  openshift.ns.addResource('builds');
  openshift.ns.addResource('imagestreams');
  openshift.ns.addResource('rolebindings');
  openshift.addResource('projectrequests');
  openshift.addResource('projects');



  let projectStatus = {}
  try {
    const projectsGet = Promise.promisify(openshift.projects(openshiftProject).get, { context: openshift.projects(openshiftProject) })
    projectStatus = await projectsGet()
    logger.info(`Project ${openshiftProject} already exists, continuing`)
  } catch (err) {
    // a non existing project also throws an error, we check if it's a 404, means it does not exist, so we create it.
    if (err.code == 404) {
      logger.info(`Project ${openshiftProject}  does not exist, creating`)
      const projectrequestsPost = Promise.promisify(openshift.projectrequests.post, { context: openshift.projectrequests })
      await projectrequestsPost({ body: {"apiVersion":"v1","kind":"ProjectRequest","metadata":{"name":openshiftProject},"displayName":`[${siteGroupName}] ${branchName}`} });


    } else {
      logger.error(err)
      throw new Error
    }
  }

  try {
    const imagestreamsGet = Promise.promisify(openshift.ns(openshiftProject).imagestreams('empty').get, { context: openshift.ns(openshiftProject).imagestreams('empty') })
    projectStatus = await imagestreamsGet()
    logger.info(`Imagestream empty already exists, continuing`)
  } catch (err) {
    if (err.code == 404) {
      logger.info(`Imagestream does not exists, creating`)
      // Creating an ImageStream in this project, this ImageStream will be used by our BuildConfig as outpug ImageStream and with that fill the ENV Variable $OUTPUT_REGISTRY that we need
      // The ImageStream itself is not used.
      const imagestreamsPost = Promise.promisify(openshift.ns(openshiftProject).imagestreams.post, { context: openshift.ns(openshiftProject).imagestreams })
      await imagestreamsPost({ body: {"kind":"ImageStream","apiVersion":"v1","metadata":{"name":"empty"} }});
    } else {
      logger.error(err)
      throw new Error
    }
  }


  try {
    const serviceaccountsGet = Promise.promisify(kubernetes.ns(openshiftProject).serviceaccounts('lagoon-deployer').get, { context: kubernetes.ns(openshiftProject).serviceaccounts('lagoon-deployer') })
    projectStatus = await serviceaccountsGet()
    logger.info(`ServiceAccount lagoon-deployer already exists, continuing`)
  } catch (err) {
    if (err.code == 404) {
      logger.info(`ServiceAccount lagoon-deployer does not exists, creating`)
      const serviceaccountsPost = Promise.promisify(kubernetes.ns(openshiftProject).serviceaccounts.post, { context: kubernetes.ns(openshiftProject).serviceaccounts })
      await serviceaccountsPost({ body: {"kind":"ServiceAccount","apiVersion":"v1","metadata":{"name":"lagoon-deployer"} }})
      const rolebindingsPost = Promise.promisify(openshift.ns(openshiftProject).rolebindings.post, { context: openshift.ns(openshiftProject).rolebindings })
      await rolebindingsPost({ body: {"kind":"RoleBinding","apiVersion":"v1","metadata":{"name":"edit","namespace":openshiftProject},"roleRef":{"name":"edit"},"subjects":[{"name":"lagoon-deployer","kind":"ServiceAccount","namespace":openshiftProject}]}})
    } else {
      logger.error(err)
      throw new Error
    }
  }

  let sshKey = {}
  const sshKeyBase64 = new Buffer(deployPrivateKey.replace(/\\n/g, "\n")).toString('base64')
  try {
    const secretsGet = Promise.promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').get, { context: kubernetes.ns(openshiftProject).secrets('lagoon-sshkey') })
    sshKey = await secretsGet()
    logger.info(`Secret lagoon-sshkey already exists, updating`)
    const secretsPut = Promise.promisify(kubernetes.ns(openshiftProject).secrets('lagoon-sshkey').put, { context: kubernetes.ns(openshiftProject).secrets('lagoon-sshkey') })
    await secretsPut({ body: {"apiVersion":"v1","kind":"Secret","metadata":{"name":"lagoon-sshkey", "resourceVersion": sshKey.metadata.resourceVersion },"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})
  } catch (err) {
    if (err.code == 404) {
      logger.info(`Secret lagoon-sshkey does not exists, creating`)
      const secretsPost = Promise.promisify(kubernetes.ns(openshiftProject).secrets.post, { context: kubernetes.ns(openshiftProject).secrets })
      await secretsPost({ body: {"apiVersion":"v1","kind":"Secret","metadata":{"name":"lagoon-sshkey"},"type":"kubernetes.io/ssh-auth","data":{"ssh-privatekey":sshKeyBase64}}})
    } else {
      logger.error(err)
      throw new Error
    }
  }

  const serviceaccountsGet = Promise.promisify(kubernetes.ns(openshiftProject).serviceaccounts("lagoon-deployer").get, { context: kubernetes.ns(openshiftProject).serviceaccounts("lagoon-deployer") })
  serviceaccount = await serviceaccountsGet()

  // a ServiceAccount can have multiple secrets, we are interested in one that has starts with 'lagoon-deployer-token'
  for (var key in serviceaccount.secrets) {
    if(/^lagoon-deployer-token/.test(key.name)) {
      const serviceaccountTokenSecret = key.name
      break;
    }
    throw new Error('Could not find token secret for ServiceAccount lagoon-deployer')
  }


  try {
    const buildConfigsGet = Promise.promisify(openshift.ns(openshiftProject).buildconfigs('lagoon').get, { context: openshift.ns(openshiftProject).buildconfigs('lagoon') })
    currentBuildConfig = await buildConfigsGet()
    logger.info(`Buildconfig lagoon already exists, updating`)
    const buildConfigsPut = Promise.promisify(openshift.ns(openshiftProject).buildconfigs('lagoon').put, { context: openshift.ns(openshiftProject).buildconfigs('lagoon') })
    // The OpenShift API needs the current resource Version so it knows that we're updating data of the last known version. This is filled within currentBuildConfig.metadata.resourceVersion
    await buildConfigsPut({ body: buildconfig(currentBuildConfig.metadata.resourceVersion, buildFromImage, serviceaccountTokenSecret) })
  } catch (err) {
    // Same as for projects, if BuildConfig does not exist, it throws an error and we check the error is an 404 and with that we know it does not exist.
    if (err.code == 404) {
      logger.info(`Buildconfig lagoon does not exist, creating`)
      const buildConfigsPost = Promise.promisify(openshift.ns(openshiftProject).buildconfigs.post, { context: openshift.ns(openshiftProject).buildconfigs })
      // This is a complete new BuildConfig, so the resource version is "0" (it will be updated automatically by OpenShift)
      await buildConfigsPost({ body: buildconfig("0", buildFromImage, serviceaccountTokenSecret) })
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Instantiate = Create a new Build from an existing BuildConfig
  const buildConfigsInstantiatePost = Promise.promisify(openshift.ns(openshiftProject).buildconfigs('lagoon/instantiate').post, { context: openshift.ns(openshiftProject).buildconfigs('lagoon/instantiate') })
  const build = await buildConfigsInstantiatePost({body: {"kind":"BuildRequest","apiVersion":"v1","metadata":{"name":"lagoon"}}})
  const buildName = build.metadata.name

  logger.verbose(`Running build: ${buildName}`)

  const payload = {
    buildName: buildName,
    siteGroupName: siteGroupName,
    openshiftProject: openshiftProject,
    branchName: branchName,
    sha: sha
  }

  const taskMonitorLogs = await createTaskMonitor('builddeploy-openshift', payload)

  let logMessage = ''
  if (gitSha) {
    logMessage = `\`${branchName}\` (${buildName})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToAmazeeioLogs('start', siteGroupName, "", "task:builddeploy-openshift:start", {},
    `*[${siteGroupName}]* ${logMessage}`
  )

}

const deathHandler = async (msg, lastError) => {
  const {
    siteGroupName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToAmazeeioLogs('error', siteGroupName, "", "task:builddeploy-openshift:error",  {},
`*[${siteGroupName}]* ${logMessage} ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const {
    siteGroupName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  let logMessage = ''
  if (sha) {
    logMessage = `\`${branchName}\` (${sha.substring(0, 7)})`
  } else {
    logMessage = `\`${branchName}\``
  }

  sendToAmazeeioLogs('warn', siteGroupName, "", "task:builddeploy-openshift:retry", {error: error.message, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${siteGroupName}]* ${logMessage} ERROR:
\`\`\`
${error}
\`\`\`
Retrying deployment in ${retryExpirationSecs} secs`
  )
}
consumeTasks('builddeploy-openshift', messageConsumer, retryHandler, deathHandler)
