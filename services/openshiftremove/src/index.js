// @flow

require('babel-polyfill');

import sleep from 'es7-sleep';
import Lokka from 'lokka';
import Transport from 'lokka-transport-http';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';
import amqp from 'amqp-connection-manager';
import jenkinsLib from 'jenkins';
import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';


// Initialize the logging mechanism
initLogger();
initSendToAmazeeioLogs();

const amazeeioapihost = process.env.AMAZEEIO_API_HOST || 'https://api.amazeeio.cloud';
const rabbitmqhost = process.env.RABBITMQ_HOST || 'localhost';
const jenkinsurl = process.env.JENKINS_URL || 'https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud';

const connection = amqp.connect([`amqp://${rabbitmqhost}`], { json: true });
const jenkins = jenkinsLib({ baseUrl: `${jenkinsurl}`, promisify: true });

const amazeeioAPI = new Lokka({
  transport: new Transport(`${amazeeioapihost}/graphql`),
});

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url));
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { reason: params }));

const channelWrapper = connection.createChannel({
  setup(channel) {
    return Promise.all([
      channel.assertQueue('amazeeio-tasks:remove-openshift-resources', { durable: true }),
      channel.prefetch(2),
      channel.consume('amazeeio-tasks:remove-openshift-resources', onMessage, { noAck: false }),
    ]);
  },
});


var onMessage = async function (msg) {
  const payload = JSON.parse(msg.content.toString());

  const {
    siteGroupName,
    openshiftRessourceAppName,
  } = payload;

  logger.verbose(`Received RemoveOpenshiftResources task for sitegroup ${siteGroupName}, app name ${openshiftRessourceAppName}`);

  const siteGroupOpenShift = await amazeeioAPI.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroupName}"){
        openshift
      }
    }
  `);

  try {
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console;
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || '';
    var openshiftUsername = siteGroupOpenShift.siteGroup.openshift.username || '';
    var openshiftPassword = siteGroupOpenShift.siteGroup.openshift.password || '';
    var openshiftProject = siteGroupOpenShift.siteGroup.openshift.project || siteGroupName;
  } catch (err) {
    logger.warn(`Cannot find openshift token and console information for sitegroup ${siteGroupName}`);
    channelWrapper.ack(msg);
    return;
  }

  logger.info(`Will remove OpenShift Resources with app name ${openshiftRessourceAppName} on ${openshiftConsole}`);


  try {
    await deleteOpenShiftRessources(siteGroupName, openshiftRessourceAppName, openshiftConsole, openshiftToken, openshiftUsername, openshiftPassword, openshiftProject);
  } catch (error) {
    logger.error(`Error removing OpenShift Resources with app name ${openshiftRessourceAppName} on ${openshiftConsole}. The error was: ${error}`);
    sendToAmazeeioLogs('error', siteGroupName, '', 'task:remove-openshift-resources:error', {},
`ERROR: removing ${openshiftRessourceAppName} on ${openshiftConsole}:
\`\`\`
${error}
\`\`\``,
    );
    channelWrapper.ack(msg);
    return;
  }
  logger.info(`Removed OpenShift Resources with app name ${openshiftRessourceAppName} on ${openshiftConsole}`);
  channelWrapper.ack(msg);
};

async function deleteOpenShiftRessources(siteGroupName, openshiftRessourceAppName, openshiftConsole, openshiftToken, openshiftUsername, openshiftPassword, openshiftProject) {
  const folderxml =
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
  `;

  // If we don't have an OpenShift token, start an amazeeio/oc container which will log us in and then get the token.
  let getTokenStage;
  if (openshiftToken == '') {
    getTokenStage =
    `
      stage ('get oc token') {
        env.OPENSHIFT_TOKEN = sh script: 'docker run --rm -e OPENSHIFT_USERNAME="${openshiftUsername}" -e OPENSHIFT_PASSWORD="${openshiftPassword}" -e OPENSHIFT_CONSOLE="${openshiftConsole}" amazeeio/oc oc whoami -t', returnStdout: true
        env.OPENSHIFT_TOKEN = env.OPENSHIFT_TOKEN.trim()
      }
    `;
  } else {
    getTokenStage =
    `
      stage ('get oc token') {
        env.OPENSHIFT_TOKEN = "${openshiftToken}"
      }
    `;
  }

  const jobdsl =
  `
  node {

    ${getTokenStage}

    stage ('oc delete') {
      sh """
        docker run --rm -e OPENSHIFT_CONSOLE=${openshiftConsole} -e OPENSHIFT_TOKEN="\${env.OPENSHIFT_TOKEN}" amazeeio/oc oc --insecure-skip-tls-verify delete all -l app=${openshiftRessourceAppName}  -n ${openshiftProject}
      """
    }
  }
  `;

  const jobxml =
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
  `;

  const foldername = `${siteGroupName}`;

  const jobname = `${foldername}/remove-${openshiftRessourceAppName}`;


  // First check if the Folder exists (hint: Folders are also called "job" in Jenkins)
  if (await jenkins.job.exists(foldername)) {
    // Folder exists, update current config.
    await jenkins.job.config(foldername, folderxml);
  } else {
    // Folder does not exist, create it.
    await jenkins.job.create(foldername, folderxml);
  }

  if (await jenkins.job.exists(jobname)) {
    // Update existing job
    logger.verbose("Job '%s' already existed, updating", jobname);
    await jenkins.job.config(jobname, jobxml);
  } else {
    // Job does not exist yet, create new one
    logger.verbose("New Job '%s' created", jobname);
    await jenkins.job.create(jobname, jobxml);
  }

  logger.verbose(`Queued job build: ${jobname}`);
  const jenkinsJobBuildResponse = await jenkins.job.build(jobname);


  const getJenkinsJobID = async (jenkinsJobBuildResponse) => {
    while (true) {
      const jenkinsQueueItem = await jenkins.queue.item(jenkinsJobBuildResponse);
      if (jenkinsQueueItem.blocked == false) {
        if (jenkinsQueueItem.executable) {
          return jenkinsQueueItem.executable.number;
        }
        logger.warn(`weird response from Jenkins. Trying again in 2 Secs. Reponse was: ${JSON.stringify(jenkinsQueueItem)}`);
        await sleep(2000);
      } else {
        logger.verbose(`Job Build blocked, will try in 5 secs. Reason: ${jenkinsQueueItem.why}`);
        await sleep(5000);
      }
    }
  };

  const jenkinsJobID = await getJenkinsJobID(jenkinsJobBuildResponse);

  logger.verbose(`Running job build: ${jobname}, job id: ${jenkinsJobID}`);

  const amazeeioLogsText = `resources with label \`${openshiftRessourceAppName}\` on \`${openshiftConsole}\` in \`${openshiftProject}\``;

  sendToAmazeeioLogs('start', siteGroupName, '', 'task:remove-openshift-resources:start', {},
    `Start: remove ${amazeeioLogsText}`,
  );

  const log = jenkins.build.logStream(jobname, jenkinsJobID);

  return new Promise((resolve, reject) => {
    log.on('data', (text) => {
      logger.silly(text);
    });

    log.on('error', (error) => {
      sendToAmazeeioLogs('error', siteGroupName, '', 'task:remove-openshift-resources:error', {},
  `ERROR: removing ${amazeeioLogsText}:
  \`\`\`
  ${error}
  \`\`\``,
      );
      logger.error(error);
      throw error;
    });

    log.on('end', async () => {
      const result = await jenkins.build.get(jobname, jenkinsJobID);

      if (result.result === 'SUCCESS') {
        sendToAmazeeioLogs('success', siteGroupName, '', 'task:remove-openshift-resources:finished', {},
          `Finished: remove ${amazeeioLogsText}`,
        );
        logger.verbose(`Finished job build: ${jobname}, job id: ${jenkinsJobID}`);
      } else {
        sendToAmazeeioLogs('error', siteGroupName, '', 'task:remove-openshift-resources:error', {}, `ERROR: Removing \`${openshiftRessourceAppName}\``);
        logger.error(`Finished FAILURE job removal: ${jobname}, job id: ${jenkinsJobID}`);
      }
      resolve();
    });
  });
}
