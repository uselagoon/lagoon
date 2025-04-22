import * as R from 'ramda';
import {
  connect,
  AmqpConnectionManager,
  ChannelWrapper
} from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { logger } from './logs/local-logger';
import {
  EnvKeyValue,
  EnvVariableScope,
  Kubernetes,
  Project,
  getEnvironmentsForProject,
  getOpenShiftInfoForProject,
  getOpenShiftInfoForEnvironment,
  getEnvironmentByIdWithVariables,
  addOrUpdateEnvironment,
  getEnvironmentByName,
  addDeployment,
  getOrganizationByIdWithEnvs,
  getOrganizationById,
} from './api';
import {
  deployTargetBranches,
  deployTargetPullrequest,
  deployTargetPromote
} from './deploy-tasks';
import { InternalEnvVariableScope, DeployData, DeployType, RemoveData } from './types';
// @ts-ignore
import sha1 from 'sha1';
import crypto from 'crypto';
import moment from 'moment';

import { encodeJSONBase64, encodeBase64, toNumber, jsonMerge } from './util/func';
import { getConfigFromEnv } from './util/config';
import { hasEnvVar, getEnvVarValue } from './util/lagoon';

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
  removeListener: (() => { }) as any,
  listeners: (() => { }) as any,

  // Default functions for AmqpConnectionManager
  addListener: (() => { }) as any,
  on: (() => { }) as any,
  once: (() => { }) as any,
  prependListener: (() => { }) as any,
  prependOnceListener: (() => { }) as any,
  createChannel: (() => { }) as any,
  isConnected: (() => { }) as any,
  close: (() => { }) as any,
  heartbeatIntervalInSeconds: 0,
  reconnectTimeInSeconds: 0,
  connect: function (options?: { timeout?: number; }): Promise<void> {
    throw new Error('Function not implemented.');
  },
  reconnect: function (): void {
    throw new Error('Function not implemented.');
  },
  connection: undefined,
  channelCount: 0
};

export let connection: AmqpConnectionManager = defaultConnection;
const rabbitmqHost = getConfigFromEnv('RABBITMQ_HOST', 'broker');
const rabbitmqUsername = getConfigFromEnv('RABBITMQ_USERNAME', 'guest');
const rabbitmqPassword = getConfigFromEnv('RABBITMQ_PASSWORD', 'guest');

const taskPrefetch = toNumber(getConfigFromEnv('TASK_PREFETCH_COUNT', '2'));

// these are required for the builddeploydata creation
// they match what are used in the kubernetesbuilddeploy service
// @TODO: INFO
// some of these variables will need to be added to webhooks2tasks in the event that overwriting is required
// deploys received by that webhooks2tasks will use functions exported by tasks, where previously they would be passed to a seperate service
// this is because there is no single service handling deploy tasks when the controller is used
// currently the services that may need to use these variables are:
//    * `api`
//    * `webhooks2tasks`
const CI = getConfigFromEnv('CI', 'false');
const defaultBuildDeployImage = process.env.DEFAULT_BUILD_DEPLOY_IMAGE
const edgeBuildDeployImage = process.env.EDGE_BUILD_DEPLOY_IMAGE
const overwriteActiveStandbyTaskImage = process.env.OVERWRITE_ACTIVESTANDBY_TASK_IMAGE
const jwtSecretString = getConfigFromEnv('JWTSECRET', 'super-secret-string');
const projectSeedString = getConfigFromEnv('PROJECTSEED', 'super-secret-string');

class NoNeedToRemoveBranch extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'NoNeedToRemoveBranch';
  }
}

class DeployTargetDisabled extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'DeployTargetDisabled';
  }
}

class CannotDeleteProductionEnvironment extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'CannotDeleteProductionEnvironment';
  }
}

class EnvironmentLimit extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'EnvironmentLimit';
  }
}

class OrganizationEnvironmentLimit extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'OrganizationEnvironmentLimit';
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
}

// makes strings "safe" if it is to be used in something dns related
export const makeSafe = (string: string): string =>
  string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')

// @TODO: make sure if it fails, it does so properly
export const getControllerBuildData = async function(deployTarget: any, deployData: DeployData) {
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
    buildName, // buildname now comes from where the deployments are created, this is so it can be returned to the user when it is triggered
    buildPriority,
    bulkId,
    bulkName,
    sourceType,
  } = deployData;

  const buildVariables = deployData.buildVariables || [];
  const sourceUser = deployData.sourceUser || 'unknown';

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
  var openshiftPromoteSourceProject = promoteSourceEnvironment ? `${projectName}-${makeSafe(promoteSourceEnvironment)}` : ""
  // A secret seed which is the same across all Environments of this Lagoon Project
  var projectSeedVal = projectSeedString || jwtSecretString
  var projectSecret = crypto.createHash('sha256').update(`${projectName}-${projectSeedVal}`).digest('hex');
  var alertContactHA: string | undefined, alertContactSA: string | undefined;
  var uptimeRobotStatusPageIds: any[] = []

  var pullrequestData: any = {};
  var promoteData: any = {};

  let gitRef: string = gitSha ? gitSha : `origin/${branchName}`
  let deployHeadRef: string | null = null;
  let deployBaseRef: string;
  let deployTitle: string | null = null;

  switch (type) {
    case DeployType.BRANCH:
      deployBaseRef = branchName
      break;
    case DeployType.PULLREQUEST:
      gitRef = gitSha
      deployBaseRef = prBaseBranch
      deployHeadRef = prHeadBranch
      deployTitle = prPullrequestTitle
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
    case DeployType.PROMOTE:
      gitRef = `origin/${promoteSourceEnvironment}`
      // @ts-ignore DeployData is a catch-all, when type is promote
      // promoteSourceEnvironment is a string.
      deployBaseRef = promoteSourceEnvironment
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

  if (deployTarget.openshift.disabled) {
    logger.error(`Couldn't deploy environment, the selected deploytarget '${deployTarget.openshift.name}' is disabled`)
    throw new DeployTargetDisabled(`Couldn't deploy environment, the selected deploytarget '${deployTarget.openshift.name}' is disabled`)
  }

  var openshiftProject = openshiftProjectPattern ? openshiftProjectPattern.replace('${environment}',environmentName).replace('${project}', projectName) : `${projectName}-${environmentName}`

  var deployTargetName = deployTarget.openshift.name
  var monitoringConfig: any = {};
  try {
    monitoringConfig = JSON.parse(deployTarget.openshift.monitoringConfig) || "invalid"
  } catch (e) {
    logger.error('Error parsing openshift.monitoringConfig from openshift: %s, continuing with "invalid"', deployTarget.openshift.name, { error: e })
    monitoringConfig = "invalid"
  }
  if (monitoringConfig != "invalid"){
    alertContactHA = monitoringConfig.uptimerobot.alertContactHA || undefined
    alertContactSA = monitoringConfig.uptimerobot.alertContactSA || undefined
    if (monitoringConfig.uptimerobot.statusPageId) {
      uptimeRobotStatusPageIds.push(monitoringConfig.uptimerobot.statusPageId)
    }
  }

  var availability = lagoonProjectData.availability || "STANDARD"

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
  if (deployTarget.openshift.buildImage != null && deployTarget.openshift.buildImage != "") {
    // set the build image here if one is defined in the api
    buildImage = deployTarget.openshift.buildImage
  }
  // otherwise work out the build image from the project if defined
  if (lagoonProjectData.buildImage != null && lagoonProjectData.buildImage != "") {
    // set the build image here if one is defined in the api
    buildImage = lagoonProjectData.buildImage
  }
  // if no build image is determined, the `remote-controller` defined default image will be used
  // once it reaches the remote cluster.

  // @TODO: openshiftProject here can't be generated on the cluster side (it should be) but the addOrUpdate mutation doesn't allow for openshiftProject to be optional
  // maybe need to have this generate a random uid initially?
  let environment;
  try {
    environment = await addOrUpdateEnvironment(branchName,
      lagoonProjectData.id,
      type,
      deployBaseRef,
      graphqlEnvironmentType,
      openshiftProject,
      openshiftId,
      openshiftProjectPattern,
      deployHeadRef,
      deployTitle)
    logger.info(`${openshiftProject}: Created/Updated Environment in API`)
  } catch (err) {
    logger.error(`Couldn't addOrUpdateEnvironment: ${err.message}`)
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
      priority,
      bulkId,
      bulkName,
      sourceUser,
      sourceType,
    );
  } catch (error) {
    logger.error(`Could not save deployment for project ${lagoonProjectData.id}. Message: ${error}`);
  }

  // encode some values so they get sent to the controllers nicely
  const { routerPattern, appliedEnvVars: envVars } = await getEnvironmentsRouterPatternAndVariables(
    lagoonProjectData,
    environment.addOrUpdateEnvironment,
    deployTarget.openshift,
    bulkId || null, bulkName || null, priority, buildVariables,
    bulkType.Deploy
  )

  let organization: any = null;
  if (lagoonProjectData.organization != null) {
    const curOrg = await getOrganizationById(lagoonProjectData.organization);
    organization = {
      name: curOrg.name,
      id: curOrg.id,
    }
  }


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
        organization: organization,
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
        key: encodeBase64(lagoonProjectData.privateKey.replace(/\\n/g, "\n")),
        monitoring: {
          contact: alertContact,
          statuspageID: uptimeRobotStatusPageIds.join('-'),
        },
        variables: {
          environment: envVars,
        },
      },
    }
  };
  return buildDeployData;
}

enum bulkType {
  Task,
  Deploy
}

export const getEnvironmentsRouterPatternAndVariables = async function(
  project: Pick<
    Project,
    'routerPattern' | 'sharedBaasBucket' | 'organization'
  > & {
    openshift: Pick<Kubernetes, 'routerPattern'>;
    envVariables: Pick<EnvKeyValue, 'name' | 'value' | 'scope'>[];
  },
  environment: { envVariables: Pick<EnvKeyValue, 'name' | 'value' | 'scope'>[]},
  deployTarget: Pick<Kubernetes, 'name' | 'routerPattern' | 'sharedBaasBucketName'>,
  bulkId: string | null,
  bulkName: string | null,
  buildPriority: number,
  buildVariables: Array<{name: string, value: string}>,
  bulkTask: bulkType
): Promise<{ routerPattern: string, appliedEnvVars: string }> {
  type EnvKeyValueInternal = Pick<EnvKeyValue, 'name' | 'value'> & {
    scope: EnvVariableScope | InternalEnvVariableScope;
  }

  // Single list of env vars that apply to an environment. Env vars from multiple
  // sources (organization, project, enviornment, build vars, etc) are
  // consolidated based on precedence.
  let appliedEnvVars: EnvKeyValueInternal[] = [];

  // Appends newVar to appliedEnvVars only if newVar is unique by name.
  const applyIfNotExists = (newVar: EnvKeyValueInternal): void => {
    const index = appliedEnvVars.findIndex((searchVar) => searchVar.name === newVar.name)

    if (index === -1) {
      appliedEnvVars.push(newVar)
    }
  }

  // Get the router pattern from the project or deploy target.
  let routerPattern = project.openshift.routerPattern
  // deployTarget.routerPattern allows null.
  if (typeof deployTarget.routerPattern !== 'undefined') {
    routerPattern = deployTarget.routerPattern
  }
  // project.routerPattern does now allow null.
  if (project.routerPattern) {
    routerPattern = project.routerPattern
  }

  // Load organization if project is in one.
  let org;
  if (project.organization) {
    org = await getOrganizationById(project.organization);
  }

  /*
   * Internal scoped env vars.
   *
   * Uses the env vars system to send data to lagoon-remote but should not be
   * overrideable by Lagoon API env vars.
   */

  applyIfNotExists({
    name: "LAGOON_SYSTEM_CORE_VERSION",
    value: getConfigFromEnv('LAGOON_VERSION', 'unknown'),
    scope: InternalEnvVariableScope.INTERNAL_SYSTEM
  });

  applyIfNotExists({
    name: 'LAGOON_SYSTEM_ROUTER_PATTERN',
    value: routerPattern,
    scope: InternalEnvVariableScope.INTERNAL_SYSTEM
  });

  const [bucketName, isSharedBucket] = await getBaasBucketName(project, deployTarget)
  if (isSharedBucket) {
    applyIfNotExists({
      name: "LAGOON_SYSTEM_PROJECT_SHARED_BUCKET",
      value: bucketName,
      scope: InternalEnvVariableScope.INTERNAL_SYSTEM
    });
  }

  if (org) {
    applyIfNotExists({
      name: "LAGOON_ROUTE_QUOTA",
      value: `${org.quotaRoute}`,
      scope: InternalEnvVariableScope.INTERNAL_SYSTEM
    });
  }

  /*
   * Normally scoped env vars.
   *
   * Env vars that are set by users, or derived from them.
   */

  // Build env vars passed to the API.
  for (const buildVar of buildVariables) {
    applyIfNotExists({
      name: buildVar.name,
      value: buildVar.value,
      scope: EnvVariableScope.BUILD
    })
  }

  // Bulk deployment env vars.
  if (bulkTask === bulkType.Deploy) {
    applyIfNotExists({
      name: "LAGOON_BUILD_PRIORITY",
      value: buildPriority.toString(),
      scope: EnvVariableScope.BUILD
    });

    if (bulkId) {
      applyIfNotExists({
        name: "LAGOON_BULK_DEPLOY",
        value: "true",
        scope: EnvVariableScope.BUILD
      });
      applyIfNotExists({
        name: "LAGOON_BULK_DEPLOY_ID",
        value: bulkId,
        scope: EnvVariableScope.BUILD
      });

      if (bulkName) {
        applyIfNotExists({
          name: "LAGOON_BULK_DEPLOY_NAME",
          value: bulkName,
          scope: EnvVariableScope.BUILD
        });
      }
    }
  } else if (bulkTask === bulkType.Task) {
    applyIfNotExists({
      name: "LAGOON_TASK_PRIORITY",
      value: buildPriority.toString(),
      scope: EnvVariableScope.BUILD
    })

    if (bulkId) {
      applyIfNotExists({
        name: "LAGOON_BULK_TASK",
        value: "true",
        scope: EnvVariableScope.BUILD
      });
      applyIfNotExists({
        name: "LAGOON_BULK_TASK_ID",
        value: bulkId,
        scope: EnvVariableScope.BUILD
      });

      if (bulkName) {
        applyIfNotExists({
          name: "LAGOON_BULK_TASK_NAME",
          value: bulkName,
          scope: EnvVariableScope.BUILD
        });
      }
    }
  }

  // Environment env vars.
  for (const envVar of environment.envVariables) {
    applyIfNotExists(envVar)
  }

  // Project env vars.
  for (const projVar of project.envVariables) {
    applyIfNotExists(projVar)
  }

  if (org) {
    // Organization env vars.
    for (const orgVar of org.envVariables) {
      applyIfNotExists(orgVar)
    }
  }

  return { routerPattern, appliedEnvVars: encodeJSONBase64(appliedEnvVars) }
}

/*
  This `createDeployTask` is the primary entrypoint after the
  API resolvers to handling a deployment creation
  and the associated environment creation.
*/
export const createDeployTask = async function(deployData: DeployData) {
  const {
    projectName,
    branchName,
    type
  } = deployData;

  const result = await getOpenShiftInfoForProject(projectName);
  const project = result.project;
  const environments = await getEnvironmentsForProject(projectName);

  if (project.organization) {
    // if this would be a new environment, check it against the environment quota
    if (!environments.project.environments.map(e => e.name).find(i => i === branchName)) {
      // check the environment quota, this prevents environments being deployed by the api or webhooks
      const curOrg = await getOrganizationByIdWithEnvs(project.organization);
      if (curOrg.environments.length >= curOrg.quotaEnvironment && curOrg.quotaEnvironment != -1) {
        throw new OrganizationEnvironmentLimit(
          `'${branchName}' would exceed organization environment quota: ${curOrg.environments.length}/${curOrg.quotaEnvironment}`
        );
      }
    }
  }

  // environments =
  //  { project:
  //     { environment_deployments_limit: 1,
  //       production_environment: 'master',
  //       environments: [ { name: 'develop', environment_type: 'development' }, [Object] ] } }

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

  if (type === DeployType.BRANCH) {
    try {
      let result = deployTargetBranches(environments.project.id, deployData)
      return result
    } catch (error) {
      throw error
    }
  } else if (type === DeployType.PULLREQUEST) {
    try {
      let result = deployTargetPullrequest(environments.project.id, deployData)
      return result
    } catch (error) {
      throw error
    }
  }
}

export const createPromoteTask = async function(promoteData: DeployData) {
  const result = await getOpenShiftInfoForProject(promoteData.projectName);
  const project = result.project;

  return deployTargetPromote(project.id, promoteData)
}

export const createRemoveTask = async function(removeData: RemoveData) {
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

  if (type === DeployType.BRANCH) {
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
  } else if (type === DeployType.PULLREQUEST) {
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
  } else if (type === DeployType.PROMOTE) {
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
}

// creates the restore job configuration for use in the misc task
const restoreConfig = (name: string, backupId: string, backupS3Config: any, restoreS3Config: any) => {
  let config = {
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

export const getTaskProjectEnvironmentVariables = async (projectName: string, environmentId: number): Promise<string> => {
  // inject variables into tasks the same way it is in builds
  // this makes variables available to tasks the same way for consumption
  // this will make it possible to handle variable updates in the future without
  // needing to trigger a full deployment
  const result = await getOpenShiftInfoForProject(projectName);
  const environment = await getEnvironmentByIdWithVariables(environmentId);

  let priority = result.project.developmentBuildPriority || 5
  if (environment.environmentById.environmentType == 'production') {
    priority = result.project.productionBuildPriority || 6
  }

  const { appliedEnvVars } = await getEnvironmentsRouterPatternAndVariables(
    result.project,
    environment.environmentById,
    environment.environmentById.openshift,
    null, null, priority, [], bulkType.Task // bulk deployments don't apply to tasks yet, but this is future proofing the function call
  )
  return appliedEnvVars
}

export const getBaasBucketName = async (
  project: Pick<Project, 'sharedBaasBucket'> & {
    envVariables: Pick<EnvKeyValue, 'name' | 'value'>[];
  },
  deploytarget: Pick<Kubernetes, 'sharedBaasBucketName' | 'name'>
): Promise<[string | undefined, false] | [string, true]> => {

  // Bucket name defined in API env var always takes precedence.
  const envVarBucketName = getEnvVarValue(project.envVariables, 'LAGOON_BAAS_BUCKET_NAME');
  if (envVarBucketName) {
    return [envVarBucketName, false];
  }

  if (project.sharedBaasBucket) {
    const sharedBaasBucketName = deploytarget.sharedBaasBucketName ?? makeSafe(deploytarget.name);

    return [sharedBaasBucketName, true];
  }

  return [undefined, false];
}

export const createTaskTask = async function(taskData: any) {
  const { project } = taskData;

  // inject variables into tasks the same way it is in builds
  const envVars = await getTaskProjectEnvironmentVariables(
    project.name,
    taskData.environment.id
  )
  taskData.project.variables = {
    environment: envVars,
  }

  if (project.organization != null) {
    const curOrg = await getOrganizationById(project.organization);
    const organization = {
      name: curOrg.name,
      id: curOrg.id,
    }
    taskData.project.organization = organization
  }

  // since controllers queues are named, we have to send it to the right tasks queue
  // do that here by querying which deploytarget the environment uses
  const result = await getOpenShiftInfoForEnvironment(taskData.environment.id);
  const deployTarget = result.environment.openshift.name
  return sendToLagoonTasks(deployTarget+":jobs", taskData);
}

export const createMiscTask = async function(taskData: any) {
  const {
    key,
    data: { project }
  } = taskData;

  // handle any controller based misc tasks
  let updatedKey = `deploytarget:${key}`;
  let taskId = 'misc-kubernetes';
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
    case 'deploytarget:restic:backup:restore':
      // Handle setting up the configuration for a restic restoration task
      const randRestoreId = Math.random().toString(36).substring(7);
      const restoreName = `restore-${R.slice(0, 7, taskData.data.backup.backupId)}-${randRestoreId}`;

      // Handle custom backup configurations
      let backupS3Config = {}
      if (
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_BUCKET') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_ACCESS_KEY') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_SECRET_KEY')
      ) {
        backupS3Config = {
          endpoint: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_ENDPOINT'),
          bucket: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_BACKUP_BUCKET'),
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
        // Parse out the baasBucketName for any migrated projects
        // check if the project is configured for a shared baas bucket
        let [bucketName, isSharedBucket] = await getBaasBucketName(result.environment.project, result.environment.openshift)
        if (isSharedBucket) {
          // if it is a shared bucket, add the repo key to it too for restores
          bucketName = `${bucketName}/baas-${makeSafe(taskData.data.project.name)}`
        }
        backupS3Config = {
          bucket: bucketName ?? `baas-${makeSafe(taskData.data.project.name)}`
        }
      }

      // Handle custom restore configurations
      let restoreS3Config = {}
      if (
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_BUCKET') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_ACCESS_KEY') &&
        hasEnvVar(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_SECRET_KEY')
      ) {
        restoreS3Config = {
          endpoint: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_ENDPOINT'),
          bucket: getEnvVarValue(result.environment.project.envVariables, 'LAGOON_BAAS_CUSTOM_RESTORE_BUCKET'),
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
      miscTaskData.misc.miscResource = encodeJSONBase64(restoreConf)
      break;
    case 'deploytarget:task:activestandby':
      // handle setting up the task configuration for running the active/standby switch
      // this uses the `advanced task` system in the controllers
      // generate out custom json payload to send to the advanced task
      var jsonPayload: any = {
        productionEnvironment: taskData.data.productionEnvironment.name,
        standbyEnvironment: taskData.data.environment.name,
        sourceNamespace: makeSafe(taskData.data.environment.openshiftProjectName),
        destinationNamespace: makeSafe(taskData.data.productionEnvironment.openshiftProjectName)
      }
      // set the task data up
      miscTaskData.advancedTask.JSONPayload = encodeJSONBase64(jsonPayload);
      // use this image to run the task
      let taskImage = ""
      // choose which task image to use
      if (CI == "true") {
        taskImage = "172.17.0.1:5000/lagoon/task-activestandby:latest"
      } else if (overwriteActiveStandbyTaskImage) {
        // allow to overwrite the image we use via OVERWRITE_ACTIVESTANDBY_TASK_IMAGE env variable
        taskImage = overwriteActiveStandbyTaskImage
      } else {
        taskImage = `uselagoon/task-activestandby:${getConfigFromEnv('LAGOON_VERSION', 'unknown')}`
      }
      miscTaskData.advancedTask.runnerImage = taskImage
      // miscTaskData.advancedTask.runnerImage = "shreddedbacon/runner:latest"
      break;
    case 'deploytarget:task:advanced':
      // inject variables into advanced tasks the same way it is in builds and standard tasks
      const envVars = await getTaskProjectEnvironmentVariables(
        taskData.data.project.name,
        taskData.data.environment.id
      )
      miscTaskData.project.variables = {
        environment: envVars,
      }
      miscTaskData.advancedTask = taskData.data.advancedTask
      break;
    case 'deploytarget:task:cancel':
      // task cancellation is just a standard unmodified message
      miscTaskData.misc = taskData.data.task
      break;
    case 'deploytarget:build:cancel':
      // build cancellation is just a standard unmodified message
      miscTaskData.misc = taskData.data.build
      break;
    default:
      miscTaskData.misc = taskData.data.build
      break;
  }
  // send the task to the queue
  if (project.organization != null) {
    const curOrg = await getOrganizationById(project.organization);
    const organization = {
      name: curOrg.name,
      id: curOrg.id,
    }
    miscTaskData.project.organization = organization
  }
  return sendToLagoonTasks(deployTarget+':misc', miscTaskData);
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

      const headers = msg.properties.headers || {'x-retry': 1}
      const retryCount = headers['x-retry']
        ? headers['x-retry'] + 1
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
