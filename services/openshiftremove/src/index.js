// @flow

const Promise = require("bluebird");
const OpenShiftClient = require('openshift-client');
const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs, initSendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { consumeTasks, initSendToLagoonTasks } = require('@lagoon/commons/src/tasks');

const { getOpenShiftInfoForProject, deleteEnvironment } = require('@lagoon/commons/src/api');

initSendToLagoonLogs();
initSendToLagoonTasks();

const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

const pause = (duration) => new Promise(res => setTimeout(res, duration));

const retry = (retries, fn, delay = 1000) =>
  fn().catch(err => retries > 1
    ? pause(delay).then(() => retry(retries - 1, fn, delay))
    : Promise.reject(err));

const messageConsumer = async function(msg) {
  const {
    projectName,
    branch,
    pullrequestNumber,
    type
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received RemoveOpenshift task for project ${projectName}, type ${type}, branch ${branch}, pullrequest ${pullrequestNumber}`);

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project

  try {
    var safeProjectName = ocsafety(projectName)
    var openshiftConsole = projectOpenShift.openshift.console_url.replace(/\/$/, "");
    var openshiftToken = projectOpenShift.openshift.token || ""

    var openshiftProject
    var environmentName

    switch (type) {
      case 'pullrequest':
        environmentName = `pr-${pullrequestNumber}`
        openshiftProject = `${safeProjectName}-pr-${pullrequestNumber}`
        break;

      case 'branch':
        const safeBranchName = ocsafety(branch)
        environmentName = branch
        openshiftProject = `${safeProjectName}-${safeBranchName}`
        break;
    }

  } catch(error) {
    logger.warn(`Error while loading openshift information for project ${projectName}, error ${error}`)
    throw(error)
  }

  logger.info(`Will remove OpenShift Project ${openshiftProject} on ${openshiftConsole}`);

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

  // Check if project exists
  try {
    const projectsGet = Promise.promisify(openshift.projects(openshiftProject).get, { context: openshift.projects(openshiftProject) })
    await projectsGet()
  } catch (err) {
    // a non existing project also throws an error, we check if it's a 404, means it does not exist, and we assume it's already removed
    if (err.code == 404) {
      logger.info(`${openshiftProject} does not exist, assuming it was removed`);
      sendToLagoonLogs('success', projectName, "", "task:remove-openshift:finished",  {},
        `*[${projectName}]* remove \`${openshiftProject}\``
      )
      return
    } else {
      logger.error(err)
      throw new Error
    }
  }

  // Project exists, let's remove it
  try {
    const deploymentconfigsGet = Promise.promisify(openshift.ns(openshiftProject).deploymentconfigs.get, { context: openshift.ns(openshiftProject).deploymentconfigs })
    const deploymentconfigs = await deploymentconfigsGet()

    for (let deploymentconfig of deploymentconfigs.items) {
      const deploymentconfigsDelete = Promise.promisify(openshift.ns(openshiftProject).deploymentconfigs(deploymentconfig.metadata.name).delete, { context: openshift.ns(openshiftProject).deploymentconfigs(deploymentconfig.metadata.name) })
      await deploymentconfigsDelete()
      logger.info(`${openshiftProject}: Deleted DeploymentConfig ${deploymentconfig.metadata.name}`);
    }

    const podsGet = Promise.promisify(kubernetes.ns(openshiftProject).pods.get, { context: kubernetes.ns(openshiftProject).pods })
    const pods = await podsGet()
    for (let pod of pods.items) {
      const podDelete = Promise.promisify(kubernetes.ns(openshiftProject).pods(pod.metadata.name).delete, { context: kubernetes.ns(openshiftProject).pods(pod.metadata.name) })
      await podDelete()
      logger.info(`${openshiftProject}: Deleted Pod ${pod.metadata.name}`);
    }

    const hasZeroPods = () => new Promise(async (resolve, reject) => {
      const pods = await podsGet()
      console.log(pods)
      if (pods.items.length === 0) {
        logger.info(`${openshiftProject}: All Pods deleted`);
        resolve()
      } else {
        logger.info(`${openshiftProject}: Pods not deleted yet, will try again in 2sec`);
        reject()
      }
    })

    try {
      await retry(10, hasZeroPods, 2000)
    } catch (err) {
      throw new Error(`${openshiftProject}: Pods not deleted`)
    }

    const projectsDelete = Promise.promisify(openshift.projects(openshiftProject).delete, { context: openshift.projects(openshiftProject) })
    await projectsDelete()
    logger.info(`${openshiftProject}: Project deleted`);
    sendToLagoonLogs('success', projectName, "", "task:remove-openshift:finished",  {},
      `*[${projectName}]* remove \`${openshiftProject}\``
    )
  } catch (err) {
    logger.error(err)
    throw new Error
  }

  // Update GraphQL API that the Environment has been deleted
  try {
    await deleteEnvironment(environmentName, projectName)
    logger.info(`${openshiftProject}: Deleted Environment '${environmentName}' in API`)
  } catch (err) {
    logger.error(err)
    throw new Error
  }

}

const deathHandler = async (msg, lastError) => {

  const {
    projectName,
    branch,
    pullrequestNumber,
    type
  } = JSON.parse(msg.content.toString())

  const openshiftProject = ocsafety(`${projectName}-${branch || pullrequestNumber}`)

  sendToLagoonLogs('error', projectName, "", "task:remove-openshift:error",  {},
`*[${projectName}]* remove \`${openshiftProject}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const {
    projectName,
    branch,
    pullrequestNumber,
    type
  } = JSON.parse(msg.content.toString())

  const openshiftProject = ocsafety(`${projectName}-${branch || pullrequestNumber}`)

  sendToLagoonLogs('warn', projectName, "", "task:remove-openshift:retry", {error: error, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${projectName}]* remove \`${openshiftProject}\` ERROR:
\`\`\`
${error}
\`\`\`
Retrying in ${retryExpirationSecs} secs`
  )
}

consumeTasks('remove-openshift', messageConsumer, retryHandler, deathHandler)
