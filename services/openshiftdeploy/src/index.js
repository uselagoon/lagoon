// @flow

const sleep = require("es7-sleep");
const { logger } = require('@amazeeio/lagoon-commons/src/local-logging');
const { getOpenShiftInfoForSiteGroup } = require('@amazeeio/lagoon-commons/src/api');

const { Jenkins } = require('jenkins');
const { sendToAmazeeioLogs, initSendToAmazeeioLogs } = require('@amazeeio/lagoon-commons/src/logs');
const { consumeTasks, initSendToAmazeeioTasks } = require('@amazeeio/lagoon-commons/src/tasks');

initSendToAmazeeioLogs();
initSendToAmazeeioTasks();

const ocBuildDeployImageLocation = process.env.OC_BUILD_DEPLOY_IMAGE_LOCATION || "dockerhub"
const dockerRunParam = process.env.DOCKER_RUN_PARARM || ""
const ciOverrideImageRepo = process.env.CI_OVERRIDE_IMAGE_REPO || ""

const messageConsumer = async msg => {
  const {
    siteGroupName,
    branchName,
    sha
  } = JSON.parse(msg.content.toString())

  logger.verbose(`Received DeployOpenshift task for sitegroup: ${siteGroupName}, branch: ${branchName}, sha: ${sha}`);

  const siteGroupOpenShift = await getOpenShiftInfoForSiteGroup(siteGroupName);

  let jenkinsUrl;

  const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

  try {
    var safeBranchName = ocsafety(branchName)
    var safeSiteGroupName = ocsafety(siteGroupName)
    var gitSha = sha
    var openshiftConsole = siteGroupOpenShift.siteGroup.openshift.console
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
    if (process.env.AMAZEEIO_GIT_SAFE_BRANCH == "master") {
      ocBuildDeployImageName = 'amazeeio/oc-build-deploy:latest';
    } else {
      ocBuildDeployImageName = `lagoon/oc-build-deploy:${process.env.AMAZEEIO_GIT_SAFE_BRANCH}`;
    }
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
          docker build --build-arg IMAGE_REPO=${ciOverrideImageRepo} -t ${ocBuildDeployImageName} /oc-build-deploy
        '''
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

  stage ('Deploy') {
    sh """docker run --rm \\
    ${dockerRunParam} \\
    -e GIT_REPO="${gitUrl}" \\
    -e GIT_REF="${gitRef}" \\
    -e OPENSHIFT_CONSOLE="${openshiftConsole}" \\
    -e OPENSHIFT_REGISTRY="${openshiftRegistry}" \\
    -e APPUIO_TOKEN="${appuioToken}" \\
    -e OPENSHIFT_TOKEN="${openshiftToken}" \\
    -e OPENSHIFT_PASSWORD="${openshiftPassword}" \\
    -e OPENSHIFT_USERNAME="${openshiftUsername}" \\
    -e OPENSHIFT_PROJECT="${openshiftProject}" \\
    -e OPENSHIFT_PROJECT_USER="${openshiftProjectUser}" \\
    -e OPENSHIFT_ROUTER_URL="${openshiftRessourceRouterUrl}" \\
    -e OPENSHIFT_TEMPLATE="${openshiftTemplate}" \\
    -e OPENSHIFT_FOLDER="${openshiftFolder}" \\
    -e SSH_PRIVATE_KEY="${deployPrivateKey}" \\
    -e SAFE_BRANCH="${safeBranchName}" \\
    -e BRANCH="${branchName}" \\
    -e IMAGE=\${env.IMAGE} \\
    -e SAFE_SITEGROUP="${safeSiteGroupName}" \\
    -e SITEGROUP="${siteGroupName}" \\
    -e CI_OVERRIDE_IMAGE_REPO="${ciOverrideImageRepo}" \\
    -v $WORKSPACE:/git \\
    -v /var/run/docker.sock:/var/run/docker.sock \\
    ${ocBuildDeployImageName}"""
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

  const jenkins = Jenkins({ baseUrl: `${jenkinsUrl}`, promisify: true});

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
