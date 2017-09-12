// @flow

const sleep = require("es7-sleep");
const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { Jenkins } = require('jenkins');
const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { consumeTasks, initSendToAmazeeioTasks } = require('@amazeeio/lagoon-commons/src/tasks');
const { getOpenShiftInfoForSiteGroup } = require('@amazeeio/lagoon-commons/src/api');

initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const jenkinsurl = process.env.JENKINS_URL || "http://admin:admin@jenkins:8080"

const jenkins = Jenkins({ baseUrl: `${jenkinsurl}`, promisify: true});

const messageConsumer = async function(msg) {
  const {
    siteGroupName,
    branch,
    pullrequest,
    type
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received RemoveOpenshiftResources task for sitegroup ${siteGroupName}, type ${type}, branch ${branch}, pullrequest ${pullrequest}`);

  const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

  const siteGroupOpenShift = await getOpenShiftInfoForSiteGroup(siteGroupName);

  try {
    var safeSiteGroupName = ocsafety(siteGroupName)
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || ""
    var openshiftUsername = siteGroupOpenShift.siteGroup.openshift.username || ""
    var openshiftPassword = siteGroupOpenShift.siteGroup.openshift.password || ""
    var openshiftProject = siteGroupOpenShift.siteGroup.openshift.project || siteGroupName

    var openshiftRessourceName

    switch (type) {
      case 'pullrequest':
        const openshiftNamingPullRequests = (typeof siteGroupOpenShift.siteGroup.openshift.naming !== 'undefined') ? siteGroupOpenShift.siteGroup.openshift.naming.pullrequest : "${sitegroup}-pr-${number}"
        openshiftRessourceName = openshiftNamingPullRequests.replace('${number}', pullrequest).replace('${sitegroup}', siteGroupName).replace(/_/g,'-')
        break;

      case 'branch':
        const safeBranchName = ocsafety(branch)
        const openshiftNamingBranches = (typeof siteGroupOpenShift.siteGroup.openshift.naming !== 'undefined') ? siteGroupOpenShift.siteGroup.openshift.naming.branch : "${sitegroup}-${branch}"
        openshiftRessourceName = openshiftNamingBranches.replace('${branch}', safeBranchName).replace('${sitegroup}', safeSiteGroupName).replace(/_/g,'-')
        break;
    }

  } catch(error) {
    logger.warn(`Cannot find openshift token and console information for sitegroup ${siteGroupName}`)
    throw(error)
  }

  logger.info(`Will remove OpenShift Resources with app name ${openshiftRessourceName} on ${openshiftConsole}`);

  var folderxml =
  `<?xml version='1.0' encoding='UTF-8'?>
  <com.cloudbees.hudson.plugins.folder.Folder plugin="cloudbees-folder@5.13">
    <actions/>
    <description></description>
    <properties/>
    <views>
      <hudson.model.AllView>
        <owner class="com.cloudbees.hudson.plugins.folder.Folder" reference="../../.."/>
        <name>All</name>
        <filterExecutors>false</filterExecutors>
        <filterQueue>false</filterQueue>
        <properties class="hudson.model.View$PropertyList"/>
      </hudson.model.AllView>
    </views>
    <viewsTabBar class="hudson.views.DefaultViewsTabBar"/>
    <healthMetrics/>
    <icon class="com.cloudbees.hudson.plugins.folder.icons.StockFolderIcon"/>
  </com.cloudbees.hudson.plugins.folder.Folder>
  `

  var jobdsl =
  `
  node {

    stage ('oc delete') {
      sh """
        docker run --rm -e OPENSHIFT_CONSOLE=${openshiftConsole} -e OPENSHIFT_TOKEN="${openshiftToken}" -e OPENSHIFT_PASSWORD="${openshiftPassword}" -e OPENSHIFT_CONSOLE="${openshiftConsole}"  amazeeio/oc oc --insecure-skip-tls-verify delete all -l app=${openshiftRessourceName}  -n ${openshiftProject}
      """
    }
  }
  `

  var jobxml =
  `<?xml version='1.0' encoding='UTF-8'?>
  <flow-definition plugin="workflow-job@2.7">
    <actions/>
    <description>${openshiftRessourceName}</description>
    <keepDependencies>false</keepDependencies>
    <properties>
      <org.jenkinsci.plugins.workflow.job.properties.DisableConcurrentBuildsJobProperty/>
    </properties>
    <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps@2.21">
      <script>${jobdsl}</script>
      <sandbox>true</sandbox>
    </definition>
    <triggers/>
    <quietPeriod>0</quietPeriod>
  </flow-definition>
  `

  var foldername = `${siteGroupName}`

  var jobname = `${foldername}/removeresources-${openshiftRessourceName}`


  // First check if the Folder exists (hint: Folders are also called "job" in Jenkins)
  if (await jenkins.job.exists(foldername)) {
    // Folder exists, update current config.
    await jenkins.job.config(foldername, folderxml)
  } else {
    // Folder does not exist, create it.
    await jenkins.job.create(foldername, folderxml)
  }

  if (await jenkins.job.exists(jobname)) {
    // Update existing job
    logger.verbose("Job '%s' already existed, updating", jobname)
    await jenkins.job.config(jobname, jobxml)
  } else {
    // Job does not exist yet, create new one
    logger.verbose("New Job '%s' created", jobname)
    await jenkins.job.create(jobname, jobxml)
  }

  logger.verbose(`Queued job build: ${jobname}`)
  let jenkinsJobBuildResponse = await jenkins.job.build(jobname)


  let getJenkinsJobID = async jenkinsJobBuildResponse => {
    while (true) {
      let jenkinsQueueItem = await jenkins.queue.item(jenkinsJobBuildResponse)
      if (jenkinsQueueItem.blocked == false) {
        if (jenkinsQueueItem.executable) {
          return jenkinsQueueItem.executable.number
        } else {
          logger.warn(`weird response from Jenkins. Trying again in 2 Secs. Reponse was: ${JSON.stringify(jenkinsQueueItem)}`)
          await sleep(2000);
        }
      } else {
        logger.verbose(`Job Build blocked, will try in 5 secs. Reason: ${jenkinsQueueItem.why}`)
        await sleep(5000);
      }
    }
  }

  let jenkinsJobID = await getJenkinsJobID(jenkinsJobBuildResponse)

  logger.verbose(`Running job build: ${jobname}, job id: ${jenkinsJobID}`)


  sendToAmazeeioLogs('start', siteGroupName, "", "task:remove-openshift-resources:start", {},
    `*[${siteGroupName}]* remove \`${openshiftRessourceName}\``
  )

  let log = jenkins.build.logStream(jobname, jenkinsJobID)

  return new Promise((resolve, reject) => {
    log.on('data', text => {
      logger.silly(text)
    });

    log.on('error', error =>  {
      logger.error(error)
      reject(error)
    });

    log.on('end', async () => {
      try {
        const result = await jenkins.build.get(jobname, jenkinsJobID)

        if (result.result === "SUCCESS") {
          sendToAmazeeioLogs('success', siteGroupName, "", "task:remove-openshift-resources:finished",  {},
            `*[${siteGroupName}]* remove \`${openshiftRessourceName}\``
          )
          logger.verbose(`Finished job build: ${jobname}, job id: ${jenkinsJobID}`)
        } else {
          sendToAmazeeioLogs('error', siteGroupName, "", "task:remove-openshift-resources:error",  {}, `*[${siteGroupName}]* remove \`${openshiftRessourceName}\` ERROR`)
          logger.error(`Finished FAILURE job removal: ${jobname}, job id: ${jenkinsJobID}`)
        }
        resolve()
      } catch(error) {
        reject(error)
      }
    });
  })

  logger.info(`Removed OpenShift Resources with app name ${openshiftRessourceName} on ${openshiftConsole}`);
}

const deathHandler = async (msg, lastError) => {

  const {
    siteGroupName,
    branch,
    pullrequest,
    type
  } = JSON.parse(msg.content.toString())

  sendToAmazeeioLogs('error', siteGroupName, "", "task:remove-openshift-resources:error",  {},
`*[${siteGroupName}]* remove ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {

  const {
    siteGroupName,
    branch,
    pullrequest,
    type
  } = JSON.parse(msg.content.toString())

  sendToAmazeeioLogs('warn', siteGroupName, "", "task:remove-openshift-resources:retry", {error: error, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${siteGroupName}]* remove ERROR:
\`\`\`
${error}
\`\`\`
Retrying in ${retryExpirationSecs} secs`
  )
}

consumeTasks('remove-openshift-resources', messageConsumer, retryHandler, deathHandler)
