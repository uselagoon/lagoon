// @flow

const Promise = require("bluebird");
const OpenShiftClient = require('openshift-client');
const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { consumeTasks, initSendToAmazeeioTasks } = require('@amazeeio/lagoon-commons/src/tasks');

const { getOpenShiftInfoForSiteGroup } = require('@amazeeio/lagoon-commons/src/api');

initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

const messageConsumer = async function(msg) {
  const {
    siteGroupName,
    branch,
    pullrequestNumber,
    type
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received RemoveOpenshift task for project ${siteGroupName}, type ${type}, branch ${branch}, pullrequest ${pullrequestNumber}`);

  const siteGroupOpenShift = await getOpenShiftInfoForSiteGroup(siteGroupName);

  try {
    var safeSiteGroupName = ocsafety(siteGroupName)
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console.replace(/\/$/, "");
    var openshiftIsAppuio = openshiftConsole === "https://console.appuio.ch" ? true : false
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || ""

    var openshiftProject

    switch (type) {
      case 'pullrequest':
        openshiftProject = openshiftIsAppuio ? `amze-${safeSiteGroupName}-pr-${pullrequestNumber}` : `${safeSiteGroupName}-pr-${pullrequestNumber}`
        break;

      case 'branch':
        const safeBranchName = ocsafety(branch)
        openshiftProject = openshiftIsAppuio ? `amze-${safeSiteGroupName}-${safeBranchName}` : `${safeSiteGroupName}-${safeBranchName}`
        break;
    }

  } catch(error) {
    logger.warn(`Error while loading openshift information for project ${siteGroupName}, error ${error}`)
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


  let projectStatus = {}
  try {
    const projectsDelete = Promise.promisify(openshift.projects(openshiftProject).delete, { context: openshift.projects(openshiftProject) })
    await projectsDelete()
    sendToAmazeeioLogs('success', siteGroupName, "", "task:remove-openshift:finished",  {},
      `*[${siteGroupName}]* remove \`${openshiftProject}\``
    )
  } catch (err) {
    if (err.code == 404) {
      logger.info(`${openshiftProject} does not exist, assuming it was removed`);
      sendToAmazeeioLogs('success', siteGroupName, "", "task:remove-openshift:finished",  {},
        `*[${siteGroupName}]* remove \`${openshiftProject}\``
      )
      return
    }
    logger.error(err)
    throw new Error
  }

}

const deathHandler = async (msg, lastError) => {

  const {
    siteGroupName,
    branch,
    pullrequestNumber,
    type
  } = JSON.parse(msg.content.toString())

  const openshiftProject = ocsafety(`${siteGroupName}-${branch || pullrequestNumber}`)

  sendToAmazeeioLogs('error', siteGroupName, "", "task:remove-openshift:error",  {},
`*[${siteGroupName}]* remove \`${openshiftProject}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const {
    siteGroupName,
    branch,
    pullrequestNumber,
    type
  } = JSON.parse(msg.content.toString())

  const openshiftProject = ocsafety(`${siteGroupName}-${branch || pullrequestNumber}`)

  sendToAmazeeioLogs('warn', siteGroupName, "", "task:remove-openshift:retry", {error: error, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${siteGroupName}]* remove \`${openshiftProject}\` ERROR:
\`\`\`
${error}
\`\`\`
Retrying in ${retryExpirationSecs} secs`
  )
}

consumeTasks('remove-openshift', messageConsumer, retryHandler, deathHandler)
