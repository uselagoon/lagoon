// @flow

require("babel-polyfill");

import sleep from "es7-sleep";
import Lokka from 'lokka';
import Transport from 'lokka-transport-http';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';
import amqp from 'amqp-connection-manager';
import jenkinsLib from 'jenkins'
import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';
import { consumeTasks, initSendToAmazeeioTasks } from '@amazeeio/amazeeio-tasks';

// Initialize the logging mechanism
initLogger();
initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const amazeeioapihost = process.env.AMAZEEIO_API_HOST || "http://api:8080"
const jenkinsurl = process.env.JENKINS_URL || "http://admin:admin@jenkins:8080"

const jenkins = jenkinsLib({ baseUrl: `${jenkinsurl}`, promisify: true});

const amazeeioAPI = new Lokka({
  transport: new Transport(`${amazeeioapihost}/graphql`)
});

const messageConsumer = async function(msg) {

  const {
    siteGroupName,
    openshiftRessourceAppName,
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received RemoveOpenshiftResources task for sitegroup ${siteGroupName}, app name ${openshiftRessourceAppName}`);

  const siteGroupOpenShift = await amazeeioAPI.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroupName}"){
        openshift
      }
    }
  `)

  try {
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console
    var openshiftIsAppuio = openshiftConsole === "https://console.appuio.ch" ? true : false
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || ""
    var openshiftUsername = siteGroupOpenShift.siteGroup.openshift.username || ""
    var openshiftPassword = siteGroupOpenShift.siteGroup.openshift.password || ""
    var openshiftProject = openshiftIsAppuio ? `amze-${openshiftRessourceAppName}` : `${openshiftRessourceAppName}`
  } catch(error) {
    logger.warn(`Cannot find openshift token and console information for sitegroup ${siteGroupName}`)
    throw(error)
  }

  logger.info(`Will remove OpenShift Resources with app name ${openshiftRessourceAppName} on ${openshiftConsole}`);

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

  // If we don't have an OpenShift token, start an amazeeio/oc container which will log us in and then get the token.
  let getTokenStage
  if (openshiftToken == "") {
    getTokenStage =
    `
      stage ('get oc token') {
        env.OPENSHIFT_TOKEN = sh script: 'docker run --rm -e OPENSHIFT_USERNAME="${openshiftUsername}" -e OPENSHIFT_PASSWORD="${openshiftPassword}" -e OPENSHIFT_CONSOLE="${openshiftConsole}" amazeeio/oc oc whoami -t', returnStdout: true
        env.OPENSHIFT_TOKEN = env.OPENSHIFT_TOKEN.trim()
      }
    `
  } else {
    getTokenStage =
    `
      stage ('get oc token') {
        env.OPENSHIFT_TOKEN = "${openshiftToken}"
      }
    `
  }

  var jobdsl =
  `
  node {

    ${getTokenStage}

    stage ('oc delete') {
      sh """
        docker run --rm -e OPENSHIFT_CONSOLE=${openshiftConsole} -e OPENSHIFT_TOKEN="\${env.OPENSHIFT_TOKEN}" amazeeio/oc oc --insecure-skip-tls-verify delete project ${openshiftProject}
      """
    }
  }
  `

  var jobxml =
  `<?xml version='1.0' encoding='UTF-8'?>
  <flow-definition plugin="workflow-job@2.7">
    <actions/>
    <description>${openshiftRessourceAppName}</description>
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

  var jobname = `${foldername}/remove-${openshiftRessourceAppName}`


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
    `*[${siteGroupName}]* remove \`${openshiftRessourceAppName}\``
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
            `*[${siteGroupName}]* remove \`${openshiftRessourceAppName}\``
          )
          logger.verbose(`Finished job build: ${jobname}, job id: ${jenkinsJobID}`)
        } else {
          sendToAmazeeioLogs('error', siteGroupName, "", "task:remove-openshift-resources:error",  {}, `*[${siteGroupName}]* remove \`${openshiftRessourceAppName}\` ERROR`)
          logger.error(`Finished FAILURE job removal: ${jobname}, job id: ${jenkinsJobID}`)
        }
        resolve()
      } catch(error) {
        reject(error)
      }
    });
  })

  logger.info(`Removed OpenShift Resources with app name ${openshiftRessourceAppName} on ${openshiftConsole}`);
}

const deathHandler = async (msg, lastError) => {

  const {
    siteGroupName,
    openshiftRessourceAppName,
  } = JSON.parse(msg.content.toString())

  sendToAmazeeioLogs('error', siteGroupName, "", "task:remove-openshift-resources:error",  {},
`*[${siteGroupName}]* remove \`${openshiftRessourceAppName}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  )

}

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {

  const {
    siteGroupName,
    openshiftRessourceAppName,
  } = JSON.parse(msg.content.toString())

  sendToAmazeeioLogs('warn', siteGroupName, "", "task:remove-openshift-resources:retry", {error: error, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${siteGroupName}]* remove \`${openshiftRessourceAppName}\` ERROR:
\`\`\`
${error}
\`\`\`
Retrying in ${retryExpirationSecs} secs`
  )
}

consumeTasks('remove-openshift-resources', messageConsumer, retryHandler, deathHandler)
