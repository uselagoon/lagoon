import * as R from 'ramda';
import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger } from './logs/local-logger';
import {
  getActiveSystemForProject,
  getEnvironmentsForProject,
  getOpenShiftInfoForProject,
  getOpenShiftInfoForEnvironment,
  getDeployTargetConfigsForProject,
  addOrUpdateEnvironment,
  getEnvironmentByName,
  addDeployment
} from './api';
import {
  deployTargetBranches,
  deployTargetPullrequest,
  deployTargetPromote
} from './deploy-tasks';
import sha1 from 'sha1';
import crypto from 'crypto';
import moment from 'moment';

import { jsonMerge } from './util/func'

interface MessageConsumer {
  (msg: ConsumeMessage): Promise<void>;
}

interface RetryHandler {
  (
    msg: ConsumeMessage,
    error: Error,
    retryCount: number,
    retryExpirationSecs: number
  ): void;
}

interface DeathHandler {
  (msg: ConsumeMessage, error: Error): void;
}

export let sendToLagoonTasks = function(
  task: string,
  payload?: any
) {
  // TODO: Actually do something here?
  return payload && undefined;
};

export let sendToLagoonTasksMonitor = function sendToLagoonTasksMonitor(
  task: string,
  payload?: any
) {
  // TODO: Actually do something here?
  return payload && undefined;
};

export let sendToLagoonActions = function(
  task: string,
  payload?: any
) {
  // TODO: Actually do something here?
  return payload && undefined;
};

// TODO: This is weird, why do we need an empty default connection? Or is there
// a better way to type this?
const defaultConnection: AmqpConnectionManager = {
  // Default function for Event
  removeListener: (() => {}) as any,
  off: (() => {}) as any,
  removeAllListeners: (() => {}) as any,
  setMaxListeners: (() => {}) as any,
  getMaxListeners: (() => {}) as any,
  listeners: (() => {}) as any,
  rawListeners: (() => {}) as any,
  emit: (() => {}) as any,
  eventNames: (() => {}) as any,
  listenerCount: (() => {}) as any,

  // Default functions for AmqpConnectionManager
  addListener: (() => {}) as any,
  on: (() => {}) as any,
  once: (() => {}) as any,
  prependListener: (() => {}) as any,
  prependOnceListener: (() => {}) as any,
  createChannel: (() => {}) as any,
  isConnected: (() => {}) as any,
  close: (() => {}) as any
};

export let connection: AmqpConnectionManager = defaultConnection;
const rabbitmqHost = process.env.RABBITMQ_HOST || 'broker';
const rabbitmqUsername = process.env.RABBITMQ_USERNAME || 'guest';
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD || 'guest';

const taskPrefetch = process.env.TASK_PREFETCH_COUNT ? Number(process.env.TASK_PREFETCH_COUNT) : 2;
const taskMonitorPrefetch = process.env.TASKMONITOR_PREFETCH_COUNT ? Number(process.env.TASKMONITOR_PREFETCH_COUNT) : 1;

// these are required for the builddeploydata creation
// they match what are used in the kubernetesbuilddeploy service
// @TODO: INFO
// some of these variables will need to be added to webhooks2tasks in the event that overwriting is required
// deploys received by that webhooks2tasks will use functions exported by tasks, where previously they would be passed to a seperate service
// this is because there is no single service handling deploy tasks when the controller is used
// currently the services that may need to use these variables are:
//    * `api`
//    * `webhooks2tasks`
const CI = process.env.CI || "false"
const registry = process.env.REGISTRY || "registry.lagoon.svc:5000"
const lagoonGitSafeBranch = process.env.LAGOON_GIT_SAFE_BRANCH || "master"
const lagoonVersion = process.env.LAGOON_VERSION
const lagoonEnvironmentType = process.env.LAGOON_ENVIRONMENT_TYPE || "development"
const defaultBuildDeployImage = process.env.DEFAULT_BUILD_DEPLOY_IMAGE
const edgeBuildDeployImage = process.env.EDGE_BUILD_DEPLOY_IMAGE
const overwriteActiveStandbyTaskImage = process.env.OVERWRITE_ACTIVESTANDBY_TASK_IMAGE
const jwtSecretString = process.env.JWTSECRET || "super-secret-string"
const projectSeedString = process.env.PROJECTSEED || "super-secret-string"

class UnknownActiveSystem extends Error {
  constructor(message) {
    super(message);
    this.name = 'UnknownActiveSystem';
  }
}

class CannotDeployWithDeployTargetConfigs extends Error {
  constructor(message) {
    super(message);
    this.name = 'CannotDeployWithDeployTargetConfigs';
  }
}

class NoNeedToRemoveBranch extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoNeedToRemoveBranch';
  }
}

class CannotDeleteProductionEnvironment extends Error {
  constructor(message) {
    super(message);
    this.name = 'CannotDeleteProductionEnvironment';
  }
}

class EnvironmentLimit extends Error {
  constructor(message) {
    super(message);
    this.name = 'EnvironmentLimit';
  }
}

// add the lagoon actions queue publisher functions
export const initSendToLagoonActions = function() {
  connection = connect(
    [`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`],
    // @ts-ignore
    { json: true }
  );

  connection.on('connect', ({ url }) =>
    logger.verbose('lagoon-actions: Connected to %s', url, {
      action: 'connected',
      url
    })
  );
  connection.on('disconnect', params =>
    // @ts-ignore
    logger.error('lagoon-actions: Not connected, error: %s', params.err.code, {
      action: 'disconnected',
      reason: params
    })
  );

  const channelWrapperTasks: ChannelWrapper = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        // Our main Exchange for all lagoon-actions
        channel.assertExchange('lagoon-actions', 'direct', { durable: true }),

        channel.assertExchange('lagoon-actions-delay', 'x-delayed-message', {
          durable: true,
          arguments: { 'x-delayed-type': 'fanout' }
        }),
        channel.bindExchange('lagoon-actions', 'lagoon-actions-delay', ''),
      ]);
    }
  });

  sendToLagoonActions = async (
    task: string,
    payload: any
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-actions', '', buffer, {
        persistent: true,
        appId: task
      });
      logger.debug(
        `lagoon-actions: Successfully created action '${task}'`,
        payload
      );
      return `lagoon-actions: Successfully created action '${task}': ${JSON.stringify(
        payload
      )}`;
    } catch (error) {
      logger.error('lagoon-actions: Error send to lagoon-actions exchange', {
        payload,
        error
      });
      throw error;
    }
  };
}

export const initSendToLagoonTasks = function() {
  connection = connect(
    [`amqp://${rabbitmqUsername}:${rabbitmqPassword}@${rabbitmqHost}`],
    // @ts-ignore
    { json: true }
  );

  connection.on('connect', ({ url }) =>
    logger.verbose('lagoon-tasks: Connected to %s', url, {
      action: 'connected',
      url
    })
  );
  connection.on('disconnect', params =>
    // @ts-ignore
    logger.error('lagoon-tasks: Not connected, error: %s', params.err.code, {
      action: 'disconnected',
      reason: params
    })
  );

  const channelWrapperTasks: ChannelWrapper = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        // Our main Exchange for all lagoon-tasks
        channel.assertExchange('lagoon-tasks', 'direct', { durable: true }),

        channel.assertExchange('lagoon-tasks-delay', 'x-delayed-message', {
          durable: true,
          arguments: { 'x-delayed-type': 'fanout' }
        }),
        channel.bindExchange('lagoon-tasks', 'lagoon-tasks-delay', ''),

        // Exchange for task monitoring
        channel.assertExchange('lagoon-tasks-monitor', 'direct', {
          durable: true
        }),

        channel.assertExchange(
          'lagoon-tasks-monitor-delay',
          'x-delayed-message',
          { durable: true, arguments: { 'x-delayed-type': 'fanout' } }
        ),
        channel.bindExchange(
          'lagoon-tasks-monitor',
          'lagoon-tasks-monitor-delay',
          ''
        )
      ]);
    }
  });

  sendToLagoonTasks = async (
    task: string,
    payload: any
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-tasks', task, buffer, {
        persistent: true
      });
      logger.debug(
        `lagoon-tasks: Successfully created task '${task}'`,
        payload
      );
      return `lagoon-tasks: Successfully created task '${task}': ${JSON.stringify(
        payload
      )}`;
    } catch (error) {
      logger.error('lagoon-tasks: Error send to lagoon-tasks exchange', {
        payload,
        error
      });
      throw error;
    }
  };

  sendToLagoonTasksMonitor = async (
    task: string,
    payload: any
  ): Promise<string> => {
    try {
      const buffer = Buffer.from(JSON.stringify(payload));
      await channelWrapperTasks.publish('lagoon-tasks-monitor', task, buffer, {
        persistent: true
      });
      logger.debug(
        `lagoon-tasks-monitor: Successfully created monitor '${task}'`,
        payload
      );
      return `lagoon-tasks-monitor: Successfully created task monitor '${task}': ${JSON.stringify(
        payload
      )}`;
    } catch (error) {
      logger.error(
        'lagoon-tasks-monitor: Error send to lagoon-tasks-monitor exchange',
        {
          payload,
          error
        }
      );
      throw error;
    }
  };
}

export const createTaskMonitor = async function(task: string, payload: any) {
  return sendToLagoonTasksMonitor(task, payload);
}

// makes strings "safe" if it is to be used in something dns related
export const makeSafe = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

// @TODO: make sure if it fails, it does so properly
export const getControllerBuildData = async function(deployData: any) {
  const {
    projectName,
    branchName,
    sha,
    type,
    pullrequestTitle,
    headBranchName: headBranch,
    headSha,
    baseBranchName: baseBranch,
    baseSha,
    promoteSourceEnvironment,
    deployTarget,
    buildName, // buildname now comes from where the deployments are created, this is so it can be returned to the user when it is triggered
    buildPriority,
    bulkId,
    bulkName,
    buildVariables
  } = deployData;

  var environmentName = makeSafe(branchName)

  const result = await getOpenShiftInfoForProject(projectName);
  const lagoonProjectData = result.project

  var overlength = 58 - projectName.length;
  if ( environmentName.length > overlength ) {
    var hash = sha1(environmentName).substring(0,4)
    environmentName = environmentName.substring(0, overlength-5)
    environmentName = environmentName.concat('-' + hash)
  }

  var environmentType = 'development'
  if (
    lagoonProjectData.productionEnvironment === environmentName
    || lagoonProjectData.standbyProductionEnvironment === environmentName
  ) {
    environmentType = 'production'
  }
  var priority = buildPriority // set the priority to one provided from the build
  // if no build priority is provided, then try and source the one from the project
  // or default to 5 or 6
  if ( priority == null ) {
    priority = lagoonProjectData.developmentBuildPriority || 5
    if (environmentType == 'production') {
      priority = lagoonProjectData.productionBuildPriority || 6
    }
  }
  var gitSha = sha as string

  var deployPrivateKey = lagoonProjectData.privateKey
  var gitUrl = lagoonProjectData.gitUrl
  var projectProductionEnvironment = lagoonProjectData.productionEnvironment
  var projectStandbyEnvironment = lagoonProjectData.standbyProductionEnvironment
  var subfolder = lagoonProjectData.subfolder || ""
  var prHeadBranch = headBranch || ""
  var prHeadSha = headSha || ""
  var prBaseBranch = baseBranch || ""
  var prBaseSha = baseSha || ""
  var prPullrequestTitle = pullrequestTitle || ""
  var prPullrequestNumber = branchName.replace('pr-','')
  var graphqlEnvironmentType = environmentType.toUpperCase()
  var graphqlGitType = type.toUpperCase()
  var openshiftPromoteSourceProject = promoteSourceEnvironment ? `${projectName}-${makeSafe(promoteSourceEnvironment)}` : ""
  // A secret seed which is the same across all Environments of this Lagoon Project
  var projectSeedVal = projectSeedString || jwtSecretString
  var projectSecret = crypto.createHash('sha256').update(`${projectName}-${projectSeedVal}`).digest('hex');
  var alertContactHA = ""
  var alertContactSA = ""
  var uptimeRobotStatusPageIds = []

  var alertContact = ""
  if (alertContactHA != undefined && alertContactSA != undefined){
    if (availability == "HIGH") {
      alertContact = alertContactHA
    } else {
      alertContact = alertContactSA
    }
  } else {
    alertContact = "unconfigured"
  }

  var uptimeRobotStatusPageId = uptimeRobotStatusPageIds.join('-')

  var pullrequestData: any = {};
  var promoteData: any = {};

  var gitRef = gitSha ? gitSha : `origin/${branchName}`

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
      var deployBaseRef = prBaseBranch
      var deployHeadRef = prHeadBranch
      var deployTitle = prPullrequestTitle
      pullrequestData = {
        pullrequest: {
          headBranch: prHeadBranch,
          headSha: prHeadSha,
          baseBranch: prBaseBranch,
          baseSha: prBaseSha,
          title: prPullrequestTitle,
          number: prPullrequestNumber,
        },
      };
      break;
    case "promote":
      var gitRef = `origin/${promoteSourceEnvironment}`
      var deployBaseRef = promoteSourceEnvironment
      var deployHeadRef = null
      var deployTitle = null
      promoteData = {
        promote: {
          sourceEnvironment: promoteSourceEnvironment,
          sourceProject: openshiftPromoteSourceProject,
        }
      };
      break;
  }

  // Get the target information
  // get the projectpattern and id from the target
  // this is only used on the initial deployment

  var openshiftProjectPattern = deployTarget.openshiftProjectPattern;
  // check if this environment already exists in the API so we can get the openshift target it is using
  // this is even valid for promotes if it isn't the first time time it is being deployed
  try {
    const apiEnvironment = await getEnvironmentByName(branchName, lagoonProjectData.id, false);
    let envId = apiEnvironment.environmentByName.id
    const environmentOpenshift = await getOpenShiftInfoForEnvironment(envId);
    deployTarget.openshift = environmentOpenshift.environment.openshift
    openshiftProjectPattern = environmentOpenshift.environment.openshiftProjectPattern
  } catch (err) {
    //do nothing
  }
  // end working out the target information
  let openshiftId = deployTarget.openshift.id;

  var openshiftProject = openshiftProjectPattern ? openshiftProjectPattern.replace('${environment}',environmentName).replace('${project}', projectName) : `${projectName}-${environmentName}`

  // set routerpattern to the routerpattern of what is defined in the project scope openshift
  var routerPattern = lagoonProjectData.openshift.routerPattern
  if (typeof deployTarget.openshift.routerPattern !== 'undefined') {
    // if deploytargets are being provided, then use what is defined in the deploytarget
    // null is a valid value for routerPatterns here...
    routerPattern = deployTarget.openshift.routerPattern
  }
  // but if the project itself has a routerpattern defined, then this should be used
  if (lagoonProjectData.routerPattern) {
    // if a project has a routerpattern defined, use it. `null` is not valid here
    routerPattern = lagoonProjectData.routerPattern
  }
  var deployTargetName = deployTarget.openshift.name
  var monitoringConfig: any = {};
  try {
    monitoringConfig = JSON.parse(deployTarget.openshift.monitoringConfig) || "invalid"
  } catch (e) {
    logger.error('Error parsing openshift.monitoringConfig from openshift: %s, continuing with "invalid"', deployTarget.openshift.name, { error: e })
    monitoringConfig = "invalid"
  }
  if (monitoringConfig != "invalid"){
    alertContactHA = monitoringConfig.uptimerobot.alertContactHA || ""
    alertContactSA = monitoringConfig.uptimerobot.alertContactSA || ""
    if (monitoringConfig.uptimerobot.statusPageId) {
      uptimeRobotStatusPageIds.push(monitoringConfig.uptimerobot.statusPageId)
    }
  }

  let buildImage = ""
  // if a default build image is defined by `DEFAULT_BUILD_DEPLOY_IMAGE` in api and webhooks2tasks, use it
  if (defaultBuildDeployImage) {
    buildImage = defaultBuildDeployImage
  }
  if (edgeBuildDeployImage) {
    // if an edge build image is defined by `EDGE_BUILD_DEPLOY_IMAGE` in api and webhooks2tasks, use it
    buildImage = edgeBuildDeployImage
  }
  // otherwise work out the build image from the deploytarget if defined
  if (deployTarget.openshift.buildImage != null) {
    // set the build image here if one is defined in the api
    buildImage = deployTarget.openshift.buildImage
  }
  // if no build image is determined, the `remote-controller` defined default image will be used
  // once it reaches the remote cluster.


  var alertContact = ""
  if (alertContactHA != undefined && alertContactSA != undefined){
    if (availability == "HIGH") {
      alertContact = alertContactHA
    } else {
      alertContact = alertContactSA
    }
  } else {
    alertContact = "unconfigured"
  }

  var availability = lagoonProjectData.availability || "STANDARD"

  // @TODO: openshiftProject here can't be generated on the cluster side (it should be) but the addOrUpdate mutation doesn't allow for openshiftProject to be optional
  // maybe need to have this generate a random uid initially?
  let environment;
  try {
    environment = await addOrUpdateEnvironment(branchName,
      lagoonProjectData.id,
      graphqlGitType,
      deployBaseRef,
      graphqlEnvironmentType,
      openshiftProject,
      openshiftId,
      openshiftProjectPattern,
      deployHeadRef,
      deployTitle)
    logger.info(`${openshiftProject}: Created/Updated Environment in API`)
  } catch (err) {
    logger.error(err)
    throw new Error
  }

  let deployment;
  let environmentId;
  try {
    const now = moment.utc();
    const apiEnvironment = await getEnvironmentByName(branchName, lagoonProjectData.id, false);
    environmentId = apiEnvironment.environmentByName.id
    deployment = await addDeployment(buildName,
      "NEW",
      now.format('YYYY-MM-DDTHH:mm:ss'),
      apiEnvironment.environmentByName.id,
      null, null, null, null,
      buildPriority,
      bulkId,
      bulkName
    );
  } catch (error) {
    logger.error(`Could not save deployment for project ${lagoonProjectData.id}. Message: ${error}`);
  }

  // append the routerpattern to the projects variables
  // use a scope of `internal_system` which isn't available to the actual API to be added via mutations
  // this way variables or new functionality can be passed into lagoon builds using the existing variables mechanism
  // avoiding the needs to hardcode them into the spec to then be consumed by the build-deploy controller
  lagoonProjectData.envVariables.push({"name":"LAGOON_SYSTEM_ROUTER_PATTERN", "value":routerPattern, "scope":"internal_system"})
  // append the `LAGOON_SYSTEM_CORE_VERSION` variable as an `internal_system` variable that can be consumed by builds and
  // is not user configurable, this value will eventually be consumed by `build-deploy-tool` to be able to reject
  // builds that are not of a supported version of lagoon
  lagoonProjectData.envVariables.push({"name":"LAGOON_SYSTEM_CORE_VERSION", "value":lagoonVersion, "scope":"internal_system"})
  if (bulkId != "") {
    // if this is a bulk deploy, add the associated bulk deploy build scope variables
    lagoonProjectData.envVariables.push({"name":"LAGOON_BULK_DEPLOY", "value":"true", "scope":"build"})
    lagoonProjectData.envVariables.push({"name":"LAGOON_BULK_DEPLOY_ID", "value":bulkId, "scope":"build"})
  }
  if (bulkName != "") {
    lagoonProjectData.envVariables.push({"name":"LAGOON_BULK_DEPLOY_NAME", "value":bulkName, "scope":"build"})
  }
  if (buildPriority != null) {
    lagoonProjectData.envVariables.push({"name":"LAGOON_BUILD_PRIORITY", "value":buildPriority.toString(), "scope":"build"})
  }

  let lagoonEnvironmentVariables = environment.addOrUpdateEnvironment.envVariables || []
  if (buildVariables != null ) {
    // add the build `scope` to all the incoming build variables for a specific build
    const scopedBuildVariables = buildVariables.map(v => ({...v, scope: 'build'}))
    // check for buildvariables being passed in
    // these need to be merged on top of environment level variables
    // handle that here
    lagoonEnvironmentVariables = jsonMerge(environment.addOrUpdateEnvironment.envVariables, scopedBuildVariables, "name")
  }

  // encode some values so they get sent to the controllers nicely
  const sshKeyBase64 = new Buffer(deployPrivateKey.replace(/\\n/g, "\n")).toString('base64')
  const envVars = new Buffer(JSON.stringify(lagoonEnvironmentVariables)).toString('base64')
  const projectVars = new Buffer(JSON.stringify(lagoonProjectData.envVariables)).toString('base64')

  // this is what will be returned and sent to the controllers via message queue, it is the lagoonbuild controller spec
  var buildDeployData: any = {
    metadata: {
      name: buildName,
      namespace: "lagoon",
    },
    spec: {
      build: {
        type: type,
        image: buildImage, // the controller will know which image to use
        ci: CI,
        priority: priority, // add the build priority
        bulkId: bulkId, // add the bulk id if present
      },
      branch: {
        name: branchName,
      },
      ...pullrequestData,
      ...promoteData,
      gitReference: gitRef,
      project: {
        id: lagoonProjectData.id,
        name: projectName,
        gitUrl: gitUrl,
        uiLink: deployment.addDeployment.uiLink,
        environment: environmentName,
        environmentType: environmentType,
        environmentId: environmentId,
        environmentIdling: environment.addOrUpdateEnvironment.autoIdle,
        projectIdling: lagoonProjectData.autoIdle,
        storageCalculator: lagoonProjectData.storageCalc,
        productionEnvironment: projectProductionEnvironment,
        standbyEnvironment: projectStandbyEnvironment,
        subfolder: subfolder,
        routerPattern: routerPattern, // @DEPRECATE: send this still for backwards compatability, but eventually this can be removed once LAGOON_SYSTEM_ROUTER_PATTERN is adopted wider
        deployTarget: deployTargetName,
        projectSecret: projectSecret,
        key: sshKeyBase64,
        registry: registry,
        monitoring: {
          contact: alertContact,
          statuspageID: uptimeRobotStatusPageId,
        },
        variables: {
          project: projectVars,
          environment: envVars,
        },
      },
    }
  };
  return buildDeployData;
}

/*
  This `createDeployTask` is the primary entrypoint after the
  API resolvers to handling a deployment creation
  and the associated environment creation.
*/
export const createDeployTask = async function(deployData: any) {
  const {
    projectName,
    branchName,
    // sha,
    type,
    pullrequestTitle
  } = deployData;

  const project = await getActiveSystemForProject(projectName, 'Deploy');
  const environments = await getEnvironmentsForProject(projectName);

  // environments =
  //  { project:
  //     { environment_deployments_limit: 1,
  //       production_environment: 'master',
  //       environments: [ { name: 'develop', environment_type: 'development' }, [Object] ] } }

  if (typeof project.activeSystemsDeploy === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'deploy' in for project ${projectName}`
    );
  }

  switch (project.activeSystemsDeploy) {
    case 'lagoon_controllerBuildDeploy':
      // we want to limit production environments, without making it configurable currently
      var productionEnvironmentsLimit = 2;

      // we want to make sure we can deploy the `production` env, and also the env defined as standby
      if (
        environments.project.productionEnvironment === branchName ||
        environments.project.standbyProductionEnvironment === branchName
      ) {
        // get a list of production environments
        const prod_environments = environments.project.environments
          .filter(e => e.environmentType === 'production')
          .map(e => e.name);
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}, existing environments are ${prod_environments}`
        );

        if (prod_environments.length >= productionEnvironmentsLimit) {
          if (prod_environments.find(i => i === branchName)) {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, environment already exists, no environment limits considered`
            );
          } else {
            throw new EnvironmentLimit(
              `'${branchName}' would exceed the configured limit of ${productionEnvironmentsLimit} production environments for project ${projectName}`
            );
          }
        }
      } else {
        // get a list of non-production environments
        const dev_environments = environments.project.environments
          .filter(e => e.environmentType === 'development')
          .map(e => e.name);
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}, existing environments are ${dev_environments}`
        );

        if (
          environments.project.developmentEnvironmentsLimit !== null &&
          dev_environments.length >=
            environments.project.developmentEnvironmentsLimit
        ) {
          if (dev_environments.find(i => i === branchName)) {
            logger.debug(
              `projectName: ${projectName}, branchName: ${branchName}, environment already exists, no environment limits considered`
            );
          } else {
            throw new EnvironmentLimit(
              `'${branchName}' would exceed the configured limit of ${environments.project.developmentEnvironmentsLimit} development environments for project ${projectName}`
            );
          }
        }
      }

      if (type === 'branch') {
        // use deployTargetBranches function to handle
        let lagoonData = {
          projectId: environments.project.id,
          projectName,
          branchName,
          project,
          deployData
        }
        try {
          let result = deployTargetBranches(lagoonData)
          return result
        } catch (error) {
          throw error
        }
      } else if (type === 'pullrequest') {
        // use deployTargetPullrequest function to handle
        let lagoonData = {
          projectId: environments.project.id,
          projectName,
          branchName,
          project,
          pullrequestTitle,
          deployData
        }
        try {
          let result = deployTargetPullrequest(lagoonData)
          return result
        } catch (error) {
          throw error
        }
      }
      break;
    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${project.activeSystemsDeploy}' for task 'deploy' in for project ${projectName}`
      );
  }
}

export const createPromoteTask = async function(promoteData: any) {
  const {
    projectName
    // branchName,
    // promoteSourceEnvironment,
    // type,
  } = promoteData;

  const project = await getActiveSystemForProject(projectName, 'Promote');

  if (typeof project.activeSystemsPromote === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'deploy' in for project ${projectName}`
    );
  }

  switch (project.activeSystemsPromote) {
    case 'lagoon_controllerBuildDeploy':
        // use deployTargetPromote function to handle
        let lagoonData = {
          projectId: project.id,
          promoteData
        }
        return deployTargetPromote(lagoonData)
    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${project.activeSystemsPromote}' for task 'deploy' in for project ${projectName}`
      );
  }
}

export const createRemoveTask = async function(removeData: any) {
  const {
    projectName,
    branch,
    branchName,
    pullrequestNumber,
    pullrequestTitle,
    forceDeleteProductionEnvironment,
    type
  } = removeData;

  // Load all environments that currently exist (and are not deleted).
  const allEnvironments = await getEnvironmentsForProject(projectName);

  // Check to see if we are deleting a production environment, and if so,
  // ensure the flag is set to allow this.
  if (
    branch === allEnvironments.project.productionEnvironment ||
    (allEnvironments.project.standbyProductionEnvironment &&
      branch === allEnvironments.project.standbyProductionEnvironment)
  ) {
    if (forceDeleteProductionEnvironment !== true) {
      throw new CannotDeleteProductionEnvironment(
        `'${branch}' is defined as the production environment for ${projectName}, refusing to remove.`
      );
    }
  }

  const project = await getActiveSystemForProject(projectName, 'Remove');

  if (typeof project.activeSystemsRemove === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for tasks 'remove' in for project ${projectName}`
    );
  }

  switch (project.activeSystemsRemove) {
    // removed `openshift` and `kubernetes` remove functionality, these services no longer exist in Lagoon
    // handle removals using the controllers, send the message to our specific target cluster queue
    case 'lagoon_controllerRemove':
      if (type === 'branch') {
        let environmentId = 0;
        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branch) {
            foundEnvironment = true;
            environmentId = environment.id;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, branchName: ${branch}, no environment found.`
          );
          throw new NoNeedToRemoveBranch(
            'Branch environment does not exist, no need to remove anything.'
          );
        }
        // consume the deploytarget from the environment now
        const result = await getOpenShiftInfoForEnvironment(environmentId);
        const deployTarget = result.environment.openshift.name
        logger.debug(
          `projectName: ${projectName}, branchName: ${branchName}. Removing branch environment.`
        );
        // use the targetname as the routing key with the action
        return sendToLagoonTasks(deployTarget+":remove", removeData);
      } else if (type === 'pullrequest') {
        // Work out the branch name from the PR number.
        let branchName = 'pr-' + pullrequestNumber;
        removeData.branchName = 'pr-' + pullrequestNumber;

        let environmentId = 0;
        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branchName) {
            foundEnvironment = true;
            environmentId = environment.id;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, pullrequest: ${branchName}, no pullrequest found.`
          );
          throw new NoNeedToRemoveBranch(
            'Pull Request environment does not exist, no need to remove anything.'
          );
        }
        // consume the deploytarget from the environment now
        const result = await getOpenShiftInfoForEnvironment(environmentId);
        const deployTarget = result.environment.openshift.name
        logger.debug(
          `projectName: ${projectName}, pullrequest: ${branchName}. Removing pullrequest environment.`
        );
        return sendToLagoonTasks(deployTarget+":remove", removeData);
      } else if (type === 'promote') {
        let environmentId = 0;
        // Check to ensure the environment actually exists.
        let foundEnvironment = false;
        allEnvironments.project.environments.forEach(function(
          environment,
          index
        ) {
          if (environment.name === branch) {
            foundEnvironment = true;
            environmentId = environment.id;
          }
        });

        if (!foundEnvironment) {
          logger.debug(
            `projectName: ${projectName}, branchName: ${branch}, no environment found.`
          );
          throw new NoNeedToRemoveBranch(
            'Branch environment does not exist, no need to remove anything.'
          );
        }
        // consume the deploytarget from the environment now
        const result = await getOpenShiftInfoForEnvironment(environmentId);
        const deployTarget = result.environment.openshift.name
        return sendToLagoonTasks(deployTarget+":remove", removeData);
      }
      break;

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${project.activeSystemsRemove}' for task 'remove' in for project ${projectName}`
      );
  }
}

// creates the restore job configuration for use in the misc task
const restoreConfig = (name, backupId, backupS3Config, restoreS3Config) => {
  let config = {
    apiVersion: 'backup.appuio.ch/v1alpha1',
    kind: 'Restore',
    metadata: {
      name
    },
    spec: {
      snapshot: backupId,
      restoreMethod: {
        s3: restoreS3Config ? restoreS3Config : {},
      },
      backend: {
        s3: backupS3Config,
        repoPasswordSecretRef: {
          key: 'repo-pw',
          name: 'baas-repo-pw'
        },
      },
    },
  };

  return config;
};

// creates the route/ingress migration config
const migrateHosts = (destinationNamespace, sourceNamespace) => {
  const randId = Math.random().toString(36).substring(7);
  const migrateName = `host-migration-${randId}`;
  let config = {
    apiVersion: 'dioscuri.amazee.io/v1',
    kind: 'HostMigration',
    metadata: {
      name: migrateName,
      annotations: {
          'dioscuri.amazee.io/migrate':'true'
      }
    },
    spec: {
      destinationNamespace: destinationNamespace,
      activeEnvironment: sourceNamespace,
    },
  };

  return config;
};

export const createTaskTask = async function(taskData: any) {
  const { project } = taskData;

  const projectSystem = await getActiveSystemForProject(project.name, 'Task');

  if (typeof projectSystem.activeSystemsTask === 'undefined') {
    throw new UnknownActiveSystem(
      `No active system for 'task' for project ${project.name}`
    );
  }

  switch (projectSystem.activeSystemsTask) {
    case 'lagoon_controllerJob':
      // since controllers queues are named, we have to send it to the right tasks queue
      // do that here by querying which deploytarget the environment uses
      const result = await getOpenShiftInfoForEnvironment(taskData.environment.id);
      const deployTarget = result.environment.openshift.name
      return sendToLagoonTasks(deployTarget+":jobs", taskData);

    default:
      throw new UnknownActiveSystem(
        `Unknown active system '${projectSystem.activeSystemsTask}' for 'task' for project ${project.name}`
      );
  }
}

export const createMiscTask = async function(taskData: any) {
  const {
    key,
    data: { project }
  } = taskData;

  const data = await getActiveSystemForProject(project.name, 'Misc');

  let updatedKey = key;
  let taskId = '';
  switch (data.activeSystemsMisc) {
    case 'lagoon_controllerMisc':
      // handle any controller based misc tasks
      updatedKey = `kubernetes:${key}`;
      taskId = 'misc-kubernetes';
      // determine the deploy target (openshift/kubernetes) for the task to go to
      // we get this from the environment
      const result = await getOpenShiftInfoForEnvironment(taskData.data.environment.id);
      const deployTarget = result.environment.openshift.name
      // this is the json structure for sending a misc task to the controller
      // there are some additional bits that can be adjusted, and these are done in the switch below on `updatedKey`
      var miscTaskData: any = {
        misc: {},
        key: updatedKey,
        environment: {
          name: taskData.data.environment.name,
          openshiftProjectName: taskData.data.environment.openshiftProjectName
        },
        project: {
          name: taskData.data.project.name
        },
        task: taskData.data.task,
        advancedTask: {}
      }
      switch (updatedKey) {
        case 'kubernetes:restic:backup:restore':
          // Handle setting up the configuration for a restic restoration task
          const randRestoreId = Math.random().toString(36).substring(7);
          const restoreName = `restore-${R.slice(0, 7, taskData.data.backup.backupId)}-${randRestoreId}`;
          // Parse out the baasBucketName for any migrated projects
          let baasBucketName = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_BUCKET_NAME"
          })
          if (baasBucketName) {
            baasBucketName = baasBucketName.value
          }

          // Handle custom backup configurations
          let lagoonBaasCustomBackupEndpoint = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT"
          })
          if (lagoonBaasCustomBackupEndpoint) {
            lagoonBaasCustomBackupEndpoint = lagoonBaasCustomBackupEndpoint.value
          }
          let lagoonBaasCustomBackupBucket = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_BACKUP_BUCKET"
          })
          if (lagoonBaasCustomBackupBucket) {
            lagoonBaasCustomBackupBucket = lagoonBaasCustomBackupBucket.value
          }
          let lagoonBaasCustomBackupAccessKey = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_BACKUP_ACCESS_KEY"
          })
          if (lagoonBaasCustomBackupAccessKey) {
            lagoonBaasCustomBackupAccessKey = lagoonBaasCustomBackupAccessKey.value
          }
          let lagoonBaasCustomBackupSecretKey = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_BACKUP_SECRET_KEY"
          })
          if (lagoonBaasCustomBackupSecretKey) {
            lagoonBaasCustomBackupSecretKey = lagoonBaasCustomBackupSecretKey.value
          }

          let backupS3Config = {}
          if (lagoonBaasCustomBackupEndpoint && lagoonBaasCustomBackupBucket && lagoonBaasCustomBackupAccessKey && lagoonBaasCustomBackupSecretKey) {
            backupS3Config = {
              endpoint: lagoonBaasCustomBackupEndpoint,
              bucket: lagoonBaasCustomBackupBucket,
              accessKeyIDSecretRef: {
                name: "lagoon-baas-custom-backup-credentials",
                key: "access-key"
              },
              secretAccessKeySecretRef: {
                name: "lagoon-baas-custom-backup-credentials",
                key: "secret-key"
              }
            }
          } else {
            backupS3Config = {
              bucket: baasBucketName ? baasBucketName : `baas-${makeSafe(taskData.data.project.name)}`
            }
          }

          // Handle custom restore configurations
          let lagoonBaasCustomRestoreEndpoint = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT"
          })
          if (lagoonBaasCustomRestoreEndpoint) {
            lagoonBaasCustomRestoreEndpoint = lagoonBaasCustomRestoreEndpoint.value
          }
          let lagoonBaasCustomRestoreBucket = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_BUCKET"
          })
          if (lagoonBaasCustomRestoreBucket) {
            lagoonBaasCustomRestoreBucket = lagoonBaasCustomRestoreBucket.value
          }
          let lagoonBaasCustomRestoreAccessKey = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY"
          })
          if (lagoonBaasCustomRestoreAccessKey) {
            lagoonBaasCustomRestoreAccessKey = lagoonBaasCustomRestoreAccessKey.value
          }
          let lagoonBaasCustomRestoreSecretKey = result.environment.project.envVariables.find(obj => {
            return obj.name === "LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY"
          })
          if (lagoonBaasCustomRestoreSecretKey) {
            lagoonBaasCustomRestoreSecretKey = lagoonBaasCustomRestoreSecretKey.value
          }

          let restoreS3Config = {}
          if (lagoonBaasCustomRestoreEndpoint && lagoonBaasCustomRestoreBucket && lagoonBaasCustomRestoreAccessKey && lagoonBaasCustomRestoreSecretKey) {
            restoreS3Config = {
              endpoint: lagoonBaasCustomRestoreEndpoint,
              bucket: lagoonBaasCustomRestoreBucket,
              accessKeyIDSecretRef: {
                name: "lagoon-baas-custom-restore-credentials",
                key: "access-key"
              },
              secretAccessKeySecretRef: {
                name: "lagoon-baas-custom-restore-credentials",
                key: "secret-key"
              }
            }
          }

          // generate the restore CRD
          const restoreConf = restoreConfig(restoreName, taskData.data.backup.backupId, backupS3Config, restoreS3Config)
          //logger.info(restoreConf)
          // base64 encode it
          const restoreBytes = new Buffer(JSON.stringify(restoreConf).replace(/\\n/g, "\n")).toString('base64')
          miscTaskData.misc.miscResource = restoreBytes
          break;
        case 'kubernetes:route:migrate':
          // handle setting up the task configuration for running the active/standby switch
          // this uses the `advanced task` system in the controllers
          // first generate the migration CRD
          const migrateConf = migrateHosts(
            makeSafe(taskData.data.productionEnvironment.openshiftProjectName),
            makeSafe(taskData.data.environment.openshiftProjectName))
          // generate out custom json payload to send to the advanced task
          var jsonPayload: any = {
            productionEnvironment: taskData.data.productionEnvironment.name,
            standbyEnvironment: taskData.data.environment.name,
            crd: migrateConf
          }
          // encode it
          const jsonPayloadBytes = new Buffer(JSON.stringify(jsonPayload).replace(/\\n/g, "\n")).toString('base64')
          // set the task data up
          miscTaskData.advancedTask.JSONPayload = jsonPayloadBytes
          // use this image to run the task
          let taskImage = ""
          // choose which task image to use
          if (CI == "true") {
            taskImage = "172.17.0.1:5000/lagoon/task-activestandby:latest"
          } else if (overwriteActiveStandbyTaskImage) {
            // allow to overwrite the image we use via OVERWRITE_ACTIVESTANDBY_TASK_IMAGE env variable
            taskImage = overwriteActiveStandbyTaskImage
          } else {
            taskImage = `uselagoon/task-activestandby:${lagoonVersion}`
          }
          miscTaskData.advancedTask.runnerImage = taskImage
          // miscTaskData.advancedTask.runnerImage = "shreddedbacon/runner:latest"
          break;
        case 'kubernetes:task:advanced':
          miscTaskData.advancedTask = taskData.data.advancedTask
          break;
        case 'kubernetes:build:cancel':
          // build cancellation is just a standard unmodified message
          miscTaskData.misc = taskData.data.build
          break;
        default:
          miscTaskData.misc = taskData.data.build
          break;
      }
      // send the task to the queue
      return sendToLagoonTasks(deployTarget+':misc', miscTaskData);
    default:
      break;
  }

  return sendToLagoonTasks(taskId, { ...taskData, key: updatedKey });
}

export const consumeTasks = async function(
  taskQueueName: string,
  messageConsumer: MessageConsumer,
  retryHandler: RetryHandler,
  deathHandler: DeathHandler
) {
  const onMessage = async (msg: ConsumeMessage) => {
    try {
      await messageConsumer(msg);
      channelWrapperTasks.ack(msg);
    } catch (error) {
      // We land here if the messageConsumer has an error that it did not itslef handle.
      // This is how the consumer informs us that we it would like to retry the message in a couple of seconds

      const retryCount = msg.properties.headers['x-retry']
        ? msg.properties.headers['x-retry'] + 1
        : 1;

      if (retryCount > 3) {
        channelWrapperTasks.ack(msg);
        deathHandler(msg, error);
        return;
      }

      const retryDelaySecs = 10 ** retryCount;
      const retryDelayMilisecs = retryDelaySecs * 1000;

      try {
        retryHandler(msg, error, retryCount, retryDelaySecs);
      } catch (retryError) {
        // intentionally empty as we don't want to fail and not requeue our message just becase the retryHandler fails
        logger.info(
          `lagoon-tasks: retryHandler for ${taskQueueName} failed with ${retryError}, will continue to retry the message anyway.`
        );
      }

      // copying options from the original message
      const retryMsgOptions = {
        appId: msg.properties.appId,
        timestamp: msg.properties.timestamp,
        contentType: msg.properties.contentType,
        deliveryMode: msg.properties.deliveryMode,
        headers: {
          ...msg.properties.headers,
          'x-delay': retryDelayMilisecs,
          'x-retry': retryCount
        },
        persistent: true
      };

      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
      channelWrapperTasks.publish(
        'lagoon-tasks-delay',
        msg.fields.routingKey,
        msg.content,
        retryMsgOptions
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperTasks.ack(msg);
    }
  };

  const channelWrapperTasks = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        channel.assertQueue(`lagoon-tasks:${taskQueueName}`, { durable: true }),
        channel.bindQueue(
          `lagoon-tasks:${taskQueueName}`,
          'lagoon-tasks',
          taskQueueName
        ),
        channel.prefetch(taskPrefetch),
        channel.consume(`lagoon-tasks:${taskQueueName}`, onMessage, {
          noAck: false
        })
      ]);
    }
  });
}

export const consumeTaskMonitor = async function(
  taskMonitorQueueName: string,
  messageConsumer: MessageConsumer,
  deathHandler: DeathHandler
) {
  const onMessage = async (msg: ConsumeMessage) => {
    try {
      await messageConsumer(msg);
      channelWrapperTaskMonitor.ack(msg);
    } catch (error) {
      // We land here if the messageConsumer has an error that it did not itslef handle.
      // This is how the consumer informs us that we it would like to retry the message in a couple of seconds

      const retryCount = msg.properties.headers['x-retry']
        ? msg.properties.headers['x-retry'] + 1
        : 1;

      if (retryCount > 750) {
        channelWrapperTaskMonitor.ack(msg);
        deathHandler(msg, error);
        return;
      }

      let retryDelaySecs = 5;

      if (error.delayFn) {
        retryDelaySecs = error.delayFn(retryCount);
      }

      const retryDelayMilisecs = retryDelaySecs * 1000;

      // copying options from the original message
      const retryMsgOptions = {
        appId: msg.properties.appId,
        timestamp: msg.properties.timestamp,
        contentType: msg.properties.contentType,
        deliveryMode: msg.properties.deliveryMode,
        headers: {
          ...msg.properties.headers,
          'x-delay': retryDelayMilisecs,
          'x-retry': retryCount
        },
        persistent: true
      };

      // publishing a new message with the same content as the original message but into the `lagoon-tasks-delay` exchange,
      // which will send the message into the original exchange `lagoon-tasks` after waiting the x-delay time.
      channelWrapperTaskMonitor.publish(
        'lagoon-tasks-monitor-delay',
        msg.fields.routingKey,
        msg.content,
        retryMsgOptions
      );

      // acknologing the existing message, we cloned it and is not necessary anymore
      channelWrapperTaskMonitor.ack(msg);
    }
  };

  const channelWrapperTaskMonitor = connection.createChannel({
    setup(channel: ConfirmChannel) {
      return Promise.all([
        channel.assertQueue(`lagoon-tasks-monitor:${taskMonitorQueueName}`, {
          durable: true
        }),
        channel.bindQueue(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          'lagoon-tasks-monitor',
          taskMonitorQueueName
        ),
        channel.prefetch(taskMonitorPrefetch),
        channel.consume(
          `lagoon-tasks-monitor:${taskMonitorQueueName}`,
          onMessage,
          { noAck: false }
        )
      ]);
    }
  });
}
