// @flow

require("babel-polyfill");

import sleep from "es7-sleep";
import Lokka from 'lokka';
import Transport from 'lokka-transport-http';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';
import jenkinsLib from 'jenkins'
import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';
import { consumeTasks, initSendToAmazeeioTasks } from '@amazeeio/amazeeio-tasks';

// Initialize the logging mechanism
initLogger();
initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const amazeeioapihost = process.env.AMAZEEIO_API_HOST || "https://api.amazeeio.cloud"

const ocBuildDeployImageLocation = process.env.OC_BUILD_DEPLOY_IMAGE_LOCATION || "dockerhub"
const dockerRunParam = process.env.DOCKER_RUN_PARARM || ""
const ocBuildDeployBranch = process.env.BRANCH || "master"


const amazeeioAPI = new Lokka({
  transport: new Transport(`${amazeeioapihost}/graphql`)
});

const messageConsumer = async msg => {
  const {
    siteGroupName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received DeployOpenshift task for sitegroup: ${siteGroupName}, branch: ${branchName}, sha: ${sha}`);

  const siteGroupOpenShift = await amazeeioAPI.query(`
    {
      siteGroup:siteGroupByName(name: "${siteGroupName}"){
        openshift
        client {
          deployPrivateKey
        }
        gitUrl
      }
    }
  `)

  let jenkinsUrl

  const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

  try {
    var safeBranchName = ocsafety(branchName)
    var safeSiteGroupName = ocsafety(siteGroupName)
    var gitSha = sha
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console
    var openshiftRegistry =siteGroupOpenShift.siteGroup.openshift.registry
    var openshiftToken = siteGroupOpenShift.siteGroup.openshift.token || ""
    var openshiftUsername = siteGroupOpenShift.siteGroup.openshift.username || ""
    var openshiftPassword = siteGroupOpenShift.siteGroup.openshift.password || ""
    var openshiftTemplate = siteGroupOpenShift.siteGroup.openshift.template
    var openshiftFolder = siteGroupOpenShift.siteGroup.openshift.folder || "."
    var openshiftProject = `${safeSiteGroupName}-${safeBranchName}`
    var deployPrivateKey = siteGroupOpenShift.siteGroup.client.deployPrivateKey
    var gitUrl = siteGroupOpenShift.siteGroup.gitUrl
    var routerPattern = siteGroupOpenShift.siteGroup.openshift.router_pattern || "${sitegroup}.${branch}.appuio.amazee.io"
    var openshiftRessourceRouterUrl = routerPattern.replace('${branch}',safeBranchName).replace('${sitegroup}', safeSiteGroupName)

    if (siteGroupOpenShift.siteGroup.openshift.jenkins) {
      jenkinsUrl = siteGroupOpenShift.siteGroup.openshift.jenkins
    } else {
      jenkinsUrl = process.env.JENKINS_URL || "http://admin:admin@jenkins:8080"
    }

  } catch(error) {
    logger.warn(`Error while loading information for sitegroup ${siteGroupName}: ${error}`)
    throw(error)
  }

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

  let ocBuildDeploystage
  let ocBuildDeployImageName
  if (ocBuildDeployImageLocation == "dockerhub") {
    ocBuildDeployImageName = `amazeeio/oc-build-deploy:${ocBuildDeployBranch}`
    ocBuildDeploystage =
    `
      stage ('oc-build-deploy docker pull') {
        sh '''
          docker pull ${ocBuildDeployImageName}
        '''
      }
    `
  } else if (ocBuildDeployImageLocation == "absolute") {
    ocBuildDeployImageName = `oc-build-deploy`
    ocBuildDeploystage =
    `
      stage ('oc-build-deploy docker build') {
        sh '''
          docker build -t ${ocBuildDeployImageName} /docker-oc-build-deploy
        '''
      }
    `
  } else {
    ocBuildDeployImageName = `oc-build-deploy-${ocBuildDeployBranch}`
    ocBuildDeploystage =
    `
      stage ('oc-build-deploy git checkout') {
        git branch: '${ocBuildDeployBranch}', changelog: false, poll: false, url: '${ocBuildDeployImageLocation}', credentialsId: 'amazeeio-github-bearer-token'
      }

      stage ('oc-build-deploy docker build') {
        sh '''
          docker build -t ${ocBuildDeployImageName} .
        '''
      }
    `
  }

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

  var shortName = `${safeBranchName}-${safeSiteGroupName}`.substring(0, 24).replace(/[^a-z0-9]+$/, '')
  var buildName = gitSha ? gitSha.substring(0, 7) : branchName
  // Deciding which git REF we would like deployed, if we have a sha given, we use that, if not we fall back to the branch (which needs be prefixed by `origin/`)
  var gitRef = gitSha ? gitSha : `origin/${branchName}`
  var jobdsl =
  `
node {
  currentBuild.displayName = "#$BUILD_ID - ${buildName}"
  env.IMAGE = env.BUILD_TAG.toLowerCase().replaceAll('%2f','-').replaceAll('/','-')

  ${ocBuildDeploystage}

  ${getTokenStage}

  stage ('Deploy') {
    sh """docker run --rm \\
    ${dockerRunParam} \\
    -e GIT_REPO="${gitUrl}" \\
    -e GIT_REF="${gitRef}" \\
    -e OPENSHIFT_CONSOLE="${openshiftConsole}" \\
    -e OPENSHIFT_REGISTRY="${openshiftRegistry}" \\
    -e OPENSHIFT_TOKEN="\${env.OPENSHIFT_TOKEN}" \\
    -e OPENSHIFT_PROJECT="${openshiftProject}" \\
    -e OPENSHIFT_ROUTER_URL="${openshiftRessourceRouterUrl}" \\
    -e OPENSHIFT_TEMPLATE="${openshiftTemplate}" \\
    -e OPENSHIFT_FOLDER="${openshiftFolder}" \\
    -e SSH_PRIVATE_KEY="${deployPrivateKey}" \\
    -e SAFE_BRANCH="${safeBranchName}" \\
    -e BRANCH="${branchName}" \\
    -e IMAGE=\${env.IMAGE} \\
    -e SAFE_SITEGROUP="${safeSiteGroupName}" \\
    -e SITEGROUP="${siteGroupName}" \\
    -v $WORKSPACE:/git \\
    -v /var/run/docker.sock:/var/run/docker.sock \\
    ${ocBuildDeployImageName}"""
  }

  // Using openshiftVerifyDeployment which will monitor the current deployment and only continue when it is done.
  stage ('OpenShift: deployment') {
    env.SKIP_TLS = true
    openshiftVerifyDeployment apiURL: "${openshiftConsole}", authToken: env.OPENSHIFT_TOKEN, depCfg: "app", namespace: "${openshiftProject}", replicaCount: '', verbose: 'false', verifyReplicaCount: 'false', waitTime: '15', waitUnit: 'min', SKIP_TLS: true
  }

}`

  var jobxml =
  `<?xml version='1.0' encoding='UTF-8'?>
  <flow-definition plugin="workflow-job@2.7">
    <actions/>
    <description>${safeBranchName}</description>
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

  var jobname = `${foldername}/deploy-${safeBranchName}`

  const jenkins = jenkinsLib({ baseUrl: `${jenkinsUrl}`, promisify: true});

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
  let logMessage = ''
  if (gitSha) {
    logMessage = `\`${branchName}\` (${buildName})`
  } else {
    logMessage = `\`${branchName}\``
  }

  logger.verbose(`Running job build: ${jobname}, job id: ${jenkinsJobID}`)

  sendToAmazeeioLogs('start', siteGroupName, "", "task:deploy-openshift:start", {},
    `*[${siteGroupName}]* ${logMessage}`
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
          sendToAmazeeioLogs('success', siteGroupName, "", "task:deploy-openshift:finished",  {},
            `*[${siteGroupName}]* ${logMessage} ${openshiftRessourceRouterUrl}`
          )
          logger.verbose(`Finished job build: ${jobname}, job id: ${jenkinsJobID}`)
        } else {
          sendToAmazeeioLogs('error', siteGroupName, "", "task:deploy-openshift:error",  {}, `*[${siteGroupName}]* ${logMessage} ERROR`)
          logger.error(`Finished FAILURE job build: ${jobname}, job id: ${jenkinsJobID}`)
        }
        resolve()
      } catch(error) {
        reject(error)
      }
    });
  })
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

  sendToAmazeeioLogs('error', siteGroupName, "", "task:deploy-openshift:error",  {},
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

  sendToAmazeeioLogs('warn', siteGroupName, "", "task:deploy-openshift:retry", {error: error.message, msg: JSON.parse(msg.content.toString()), retryCount: retryCount},
`*[${siteGroupName}]* ${logMessage} ERROR:
\`\`\`
${error}
\`\`\`
Retrying deployment in ${retryExpirationSecs} secs`
  )
}

consumeTasks('deploy-openshift', messageConsumer, retryHandler, deathHandler)