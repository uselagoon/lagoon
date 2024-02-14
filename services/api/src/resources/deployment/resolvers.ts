// @ts-ignore
import * as R from 'ramda';
// @ts-ignore
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import {
  createDeployTask,
  createMiscTask,
  createPromoteTask,
  sendToLagoonActions,
  makeSafe
  // @ts-ignore
} from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
  EVENTS
} from '../../clients/pubSub';
import { getConfigFromEnv, getLagoonRouteFromEnv } from '../../util/config';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { Helpers } from './helpers';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
// @ts-ignore
import { addTask } from '@lagoon/commons/dist/api';
import { Sql as environmentSql } from '../environment/sql';
// @ts-ignore
import S3 from 'aws-sdk/clients/s3';
// @ts-ignore
import sha1 from 'sha1';
// @ts-ignore
import { generateBuildId } from '@lagoon/commons/dist/util/lagoon';
import { jsonMerge } from '@lagoon/commons/dist/util/func';
import { logger } from '../../loggers/logger';
import { getUserProjectIdsFromRoleProjectIds } from '../../util/auth';
// @ts-ignore
import uuid4 from 'uuid4';

// @ts-ignore
const accessKeyId =  process.env.S3_FILES_ACCESS_KEY_ID || 'minio'
// @ts-ignore
const secretAccessKey =  process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123'
// @ts-ignore
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'
// @ts-ignore
const region = process.env.S3_FILES_REGION
// @ts-ignore
const s3Origin = process.env.S3_FILES_HOST || 'http://docker.for.mac.localhost:9000'

const config = {
  origin: s3Origin,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  bucket: bucket
};

const s3Client = new S3({
  endpoint: config.origin,
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region,
  params: {
    Bucket: config.bucket
  },
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

const convertDateFormat = R.init;

export const getBuildLog: ResolverFn = async (
  { remoteId, environment, name, status },
  _args,
  { sqlClientPool }
) => {
  if (!remoteId) {
    return null;
  }

  const environmentData = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(parseInt(environment));
  const projectData = await projectHelpers(sqlClientPool).getProjectById(
    environmentData.project
  );

  // we need to get the safename of the environment from when it was created
  const makeSafe = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')
  var environmentName = makeSafe(environmentData.name)
  var overlength = 58 - projectData.name.length;
  if ( environmentName.length > overlength ) {
    var hash = sha1(environmentName).substring(0,4)
    environmentName = environmentName.substring(0, overlength-5)
    environmentName = environmentName.concat('-' + hash)
  }

  try {
    // where it should be, check `buildlogs/projectName/environmentName/buildName-remoteId.txt`
    let buildLog = 'buildlogs/'+projectData.name+'/'+environmentName+'/'+name+'-'+remoteId+'.txt'
    const data = await s3Client.getObject({Bucket: bucket, Key: buildLog}).promise();

    if (!data) {
      return null;
    }
    // @ts-ignore
    let logMsg = new Buffer(JSON.parse(JSON.stringify(data.Body)).data).toString('ascii');
    return logMsg;
  } catch (e) {
    // there is no fallback location for build logs, so there is no log to show the user
    return `There was an error loading the logs: ${e.message}\nIf this error persists, contact your Lagoon support team.`;
  }
};

export const getDeploymentsByBulkId: ResolverFn = async (
  root,
  { bulkId },
  { sqlClientPool, hasPermission, models, keycloakGrant, keycloakUsersGroups }
) => {

  /*
    use the same mechanism for viewing all projects
    bulk deployments can span multiple projects, and anyone with access to a project
    will have the same rbac as `deployment:view` which covers all possible roles for a user
    otherwise it will only return all the projects they have access to
    and the listed deployments are sourced accordingly to which project
    the user has access to
  */
  let userProjectIds: number[];
  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.debug('No grant available for getDeploymentsByBulkId');
      return [];
    }

    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub
    }, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  let queryBuilder = knex('deployment')
    .where('deployment.bulk_id', bulkId)
    .toString()

  if (userProjectIds) {
    queryBuilder = knex('environment')
    .select('deployment.*')
    .join('deployment', 'environment.id', '=', 'deployment.environment')
    .join('project', 'environment.project', '=', 'project.id')
    .whereIn('project.id', userProjectIds)
    .andWhere('deployment.bulk_id', bulkId)
    .toString()
  }

  const rows = await query(sqlClientPool, queryBuilder.toString());
  const withK8s = projectHelpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  return withK8s;
};

export const getDeploymentsByFilter: ResolverFn = async (
  root,
  input,
  { sqlClientPool, hasPermission, models, keycloakGrant, keycloakUsersGroups }
) => {

  const { openshifts, deploymentStatus = ["NEW", "PENDING", "RUNNING", "QUEUED"] } = input;

  /*
    use the same mechanism for viewing all projects
    bulk deployments can span multiple projects, and anyone with access to a project
    will have the same rbac as `deployment:view` which covers all possible roles for a user
    otherwise it will only return all the projects they have access to
    and the listed deployments are sourced accordingly to which project
    the user has access to
  */
  let userProjectIds: number[];
  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.debug('No grant available for getDeploymentsByFilter');
      return [];
    }

    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub
    }, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  let queryBuilder = knex.select("deployment.*").from('deployment').
      join('environment', 'deployment.environment', '=', 'environment.id');

  if (userProjectIds) {
      queryBuilder = queryBuilder.whereIn('environment.project', userProjectIds);
  }

  if(openshifts) {
    queryBuilder = queryBuilder.whereIn('environment.openshift', openshifts);
  }

  queryBuilder = queryBuilder.whereIn('deployment.status', deploymentStatus);

  queryBuilder = queryBuilder.where('environment.deleted', '=', '0000-00-00 00:00:00');

  const queryBuilderString = queryBuilder.toString();

  const rows = await query(sqlClientPool, queryBuilderString);
  const withK8s = projectHelpers(sqlClientPool).aliasOpenshiftToK8s(rows);
  return withK8s;
};

export const getDeploymentsByEnvironmentId: ResolverFn = async (
  { id: eid },
  { name, limit },
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);

  if (!adminScopes.projectViewAll) {
    await hasPermission('deployment', 'view', {
      project: environment.project
    });
  }

  let queryBuilder = knex('deployment')
  .where('environment', eid)
  .orderBy('created', 'desc')
  .orderBy('id', 'desc');

  if (name) {
    queryBuilder = queryBuilder.andWhere('name', name);
  }

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  return query(sqlClientPool, queryBuilder.toString());
};

export const getDeploymentByRemoteId: ResolverFn = async (
  _root,
  { id },
  { sqlClientPool, hasPermission }
) => {
  const queryString = knex('deployment')
    .where('remote_id', '=', id)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const deployment = R.prop(0, rows);

  if (!deployment) {
    return null;
  }

  const perms = await query(
    sqlClientPool,
    Sql.selectPermsForDeployment(deployment.id)
  );

  await hasPermission('deployment', 'view', {
    project: R.path(['0', 'pid'], perms)
  });

  return deployment;
};

export const getDeploymentByName: ResolverFn = async (
  _root,
  { input: { project: projectName, environment: environmentName, name } },
  { sqlClientPool, hasPermission }
) => {

  const projectId = await projectHelpers(sqlClientPool).getProjectIdByName(
    projectName
  );

  await hasPermission('deployment', 'view', {
    project: projectId
  });

  const environmentRows = await environmentHelpers(sqlClientPool).getEnvironmentByNameAndProject(
    environmentName, projectId
  );

  const queryString = knex('deployment')
    .where('name', '=', name)
    .andWhere('environment', '=', environmentRows[0].id)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const deployment = R.prop(0, rows);

  if (!deployment) {
    throw new Error('No deployment found');
  }

  return deployment;
};

export const getDeploymentUrl: ResolverFn = async (
  { id, environment },
  _args,
  { sqlClientPool }
) => {
  const lagoonUiRoute = getLagoonRouteFromEnv(
    /\/ui-/,
    getConfigFromEnv('UI_URL', 'http://localhost:8888')
  );

  const { name: project, openshiftProjectName } = await projectHelpers(
    sqlClientPool
  ).getProjectByEnvironmentId(environment);

  const deployment = await Helpers(sqlClientPool).getDeploymentById(id);

  return `${lagoonUiRoute}/projects/${project}/${openshiftProjectName}/deployments/${deployment.name}`;
};

export const addDeployment: ResolverFn = async (
  root,
  {
    input: {
      id,
      name,
      status,
      created,
      started,
      completed,
      environment: environmentId,
      remoteId,
      priority,
      bulkId,
      bulkName,
      buildStep,
      sourceUser,
      sourceType,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);
  await hasPermission('environment', `deploy:${environment.environmentType}`, {
    project: environment.project
  });

  if (!sourceUser) {
      sourceUser = await Helpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  }
  if (!sourceType) {
    sourceType = "API"
  }
  const { insertId } = await query(
    sqlClientPool,
    Sql.insertDeployment({
      id,
      name,
      status,
      created,
      started,
      completed,
      environment: environmentId,
      remoteId,
      priority,
      bulkId,
      bulkName,
      buildStep,
      sourceType,
      sourceUser,
    })
  );

  const rows = await query(sqlClientPool, Sql.selectDeployment(insertId));
  const deployment = R.prop(0, rows);

  pubSub.publish(EVENTS.DEPLOYMENT, deployment);
  return deployment;
};

export const deleteDeployment: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const perms = await query(sqlClientPool, Sql.selectPermsForDeployment(id));

  await hasPermission('deployment', 'delete', {
    project: R.path(['0', 'pid'], perms)
  });

  await query(sqlClientPool, Sql.deleteDeployment(id));

  userActivityLogger(`User deleted deployment '${id}'`, {
    project: '',
    event: 'api:deleteDeployment',
    payload: {
      deployment: id
    }
  });

  return 'success';
};

export const updateDeployment: ResolverFn = async (
  root,
  {
    input: {
      id,
      patch,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
        priority,
        bulkId,
        bulkName,
        buildStep
      }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const permsDeployment = await query(
    sqlClientPool,
    Sql.selectPermsForDeployment(id)
  );

  // Check access to modify deployment as it currently stands
  await hasPermission('deployment', 'update', {
    project: R.path(['0', 'pid'], permsDeployment)
  });

  if (environment) {
    const permsEnv = await environmentHelpers(sqlClientPool).getEnvironmentById(
      environment
    );
    // Check access to modify deployment as it will be updated
    await hasPermission('environment', 'view', {
      project: permsEnv.project
    });
  }

  await query(
    sqlClientPool,
    Sql.updateDeployment({
      id,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
        priority,
        bulkId,
        bulkName,
        buildStep
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectDeployment(id));
  const deployment = R.prop(0, rows);

  pubSub.publish(EVENTS.DEPLOYMENT, deployment);

  userActivityLogger(`User updated deployment '${id}'`, {
    project: '',
    event: 'api:updateDeployment',
    payload: {
      id,
      deployment,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        remoteId,
        priority,
        bulkId,
        bulkName,
        buildStep
      }
    }
  });

  return deployment;
};

export const cancelDeployment: ResolverFn = async (
  root,
  { input: { deployment: deploymentInput } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const deployment = await Helpers(
    sqlClientPool
  ).getDeploymentByDeploymentInput(deploymentInput);
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(deployment.environment);
  const project = await projectHelpers(sqlClientPool).getProjectById(
    environment.project
  );

  await hasPermission('deployment', 'cancel', {
    project: project.id
  });

  const data = {
    build: deployment,
    environment,
    project
  };

  userActivityLogger(`User cancelled deployment for '${deployment.environment}'`, {
    project: '',
    event: 'api:cancelDeployment',
    payload: {
      deploymentInput,
      data: data.build
    }
  });

  // check if the deploytarget for this environment is disabled
  const deploytarget = await environmentHelpers(sqlClientPool).getEnvironmentsDeploytarget(environment.openshift);
  if (deploytarget[0].disabled) {
    // if it is, proceed to mark the build as cancelled
    var date = new Date();
    var completed = convertDateFormat(date.toISOString());
    await query(
      sqlClientPool,
      Sql.updateDeployment({
        id: deployment.id,
        patch: {
          status: "cancelled",
          completed,
          environment: environment.id,
        }
      })
    );

    // just normal lagoon environment name conversion to lowercase and safeing
    const makeSafe = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g,'-')
    var environmentName = makeSafe(environment.name)
    var overlength = 58 - project.name.length;
    if ( environmentName.length > overlength ) {
      var hash = sha1(environmentName).substring(0,4)
      environmentName = environmentName.substring(0, overlength-5)
      environmentName = environmentName.concat('-' + hash)
    }
    // then publish a message to the logs system with the build log
    sendToLagoonLogs(
      'info',
      project.name,
      '',
      `build-logs:builddeploy-kubernetes:${deployment.name}`,
      { branchName: environmentName,
        buildName: deployment.name,
        buildStatus: "cancelled",
        buildPhase: "cancelled",
        buildStep: "cancelled",
        environmentId: environment.id,
        projectId: project.id,
        remoteId: deployment.remoteId,
       },
      `========================================\nCancelled build as deploytarget '${deploytarget[0].name}' is disabled\n========================================\n`
    );
    return 'success';
  }

  try {
    await createMiscTask({ key: 'build:cancel', data });
    return 'success';
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:cancelDeployment',
      { deploymentId: deployment.id },
      `Deployment not cancelled, reason: ${error}`
    );
    return `Error: ${error.message}`;
  }
};

export const deployEnvironmentLatest: ResolverFn = async (
  root,
  { input: {
    environment: environmentInput,
    priority,
    bulkId,
    bulkName,
    buildVariables,
    returnData
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant }
) => {

  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    // if the user isn't an admin, then they aren't allowed to set these values on deployments
    // the actions-handler service is an admin, so it has permission to do so
    if (bulkId) {
      throw new Error('Unauthorized to set bulkId, platform-admin only');
    }
    if (priority) {
      throw new Error('Unauthorized to set priority, platform-admin only');
    }
    // @TODO: alternatively, instead of saying unauthorised, it could just null out
    // and the user gets no feedback
    // buildPriority = null
    // bulkId = null
  }

  const environments = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentsByEnvironmentInput(environmentInput);
  const activeEnvironments = R.filter(
    R.propEq('deleted', '0000-00-00 00:00:00'),
    environments
  );

  if (activeEnvironments.length < 1 || activeEnvironments.length > 1) {
    throw new Error('Unauthorized');
  }

  const environment = R.prop(0, activeEnvironments);
  const project = await projectHelpers(sqlClientPool).getProjectById(
    environment.project
  );

  await hasPermission('environment', `deploy:${environment.environmentType}`, {
    project: project.id
  });

  if (project.deploymentsDisabled == 1){
    throw new Error('Deployments have been disabled for this project');
  }

  if (
    environment.deployType === 'branch' ||
    environment.deployType === 'promote'
  ) {
    if (!environment.deployBaseRef) {
      throw new Error('Cannot deploy: deployBaseRef is empty');
    }
  } else if (environment.deployType === 'pullrequest') {
    if (
      !environment.deployBaseRef &&
      !environment.deployHeadRef &&
      !environment.deployTitle
    ) {
      throw new Error(
        'Cannot deploy: deployBaseRef, deployHeadRef or deployTitle is empty'
      );
    }
  }

  let buildName = generateBuildId();
  const sourceUser = await Helpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  let deployData: {
    [key: string]: any;
  } = {
    projectName: project.name,
    type: environment.deployType,
    buildName: buildName,
    buildPriority: priority,
    bulkId: bulkId,
    bulkName: bulkName,
    buildVariables: buildVariables,
    sourceType: "API",
    sourceUser: sourceUser
  };
  let meta: {
    [key: string]: any;
  } = {
    projectName: project.name
  };
  let taskFunction;
  switch (environment.deployType) {
    case 'branch':
      deployData = {
        ...deployData,
        branchName: environment.deployBaseRef
      };
      meta = {
        ...meta,
        branchName: deployData.branchName
      };
      taskFunction = createDeployTask;
      break;

    case 'pullrequest':
      deployData = {
        ...deployData,
        pullrequestTitle: environment.deployTitle,
        pullrequestNumber: environment.name.replace('pr-', ''),
        headBranchName: environment.deployHeadRef,
        headSha: `origin/${environment.deployHeadRef}`,
        baseBranchName: environment.deployBaseRef,
        baseSha: `origin/${environment.deployBaseRef}`,
        branchName: environment.name
      };
      meta = {
        ...meta,
        pullrequestTitle: deployData.pullrequestTitle,
        pullrequestNumber: environment.name.replace('pr-', ''),
        headBranchName: environment.deployHeadRef,
        headSha: `origin/${environment.deployHeadRef}`,
        baseBranchName: environment.deployBaseRef,
        baseSha: `origin/${environment.deployBaseRef}`,
        branchName: environment.name
      };
      taskFunction = createDeployTask;
      break;

    case 'promote':
      deployData = {
        ...deployData,
        branchName: environment.name,
        promoteSourceEnvironment: environment.deployBaseRef
      };
      meta = {
        ...meta,
        branchName: deployData.branchName,
        promoteSourceEnvironment: deployData.promoteSourceEnvironment
      };
      taskFunction = createPromoteTask;
      break;

    default:
      return `Error: Unknown deploy type ${environment.deployType}`;
  }

  userActivityLogger(`User triggered a deployment on '${deployData.projectName}' for '${environment.name}'`, {
    project: '',
    event: 'api:deployEnvironmentLatest',
    payload: {
      deployData
    }
  });

  try {
    await taskFunction(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentLatest',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${environment.name}\``
    );

    if (returnData == true) {
      return deployData.buildName;
    }
    return 'success';
  } catch (error) {
    switch (error.name) {
      case 'NoNeedToDeployBranch':
        sendToLagoonLogs(
          'info',
          deployData.projectName,
          '',
          'api:deployEnvironmentLatest',
          meta,
          `*[${deployData.projectName}]* Deployment skipped \`${environment.name}\`: ${error.message}`
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentLatest:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${environment.name}\`: ${error.message}`
        );
        return `Error: ${error.message}`;
    }
  }
};

export const deployEnvironmentBranch: ResolverFn = async (
  root,
  { input: {
    project: projectInput,
    branchName,
    branchRef,
    priority,
    bulkId,
    bulkName,
    buildVariables,
    returnData
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant }
) => {
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );
  const envType =
    branchName === project.productionEnvironment ? 'production' : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: project.id
  });

  if (project.deploymentsDisabled == 1){
    throw new Error('Deployments have been disabled for this project');
  }

  let buildName = generateBuildId();
  const sourceUser = await Helpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)

  const deployData = {
    type: 'branch',
    projectName: project.name,
    branchName,
    sha: branchRef,
    buildName: buildName,
    buildPriority: priority,
    bulkId: bulkId,
    bulkName: bulkName,
    buildVariables: buildVariables,
    sourceType: "API",
    sourceUser: sourceUser
  };

  const meta = {
    projectName: project.name,
    branchName: deployData.branchName
  };

  userActivityLogger(`User triggered a deployment on '${deployData.projectName}' for '${deployData.branchName}'`, {
    project: '',
    event: 'api:deployEnvironmentBranch',
    payload: {
      deployData
    }
  });

  try {
    await createDeployTask(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentBranch',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${deployData.branchName}\``
    );

    if (returnData == true) {
      return deployData.buildName;
    }
    return 'success';
  } catch (error) {
    switch (error.name) {
      case 'NoNeedToDeployBranch':
        sendToLagoonLogs(
          'info',
          deployData.projectName,
          '',
          'api:deployEnvironmentBranch',
          meta,
          `*[${deployData.projectName}]* Deployment skipped \`${deployData.branchName}\`: ${error.message}`
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentBranch:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${deployData.branchName}\`: ${error}`
        );
        return `Error: ${error}`;
    }
  }
};

export const deployEnvironmentPullrequest: ResolverFn = async (
  root,
  {
    input: {
      project: projectInput,
      number,
      title,
      baseBranchName,
      baseBranchRef,
      headBranchName,
      headBranchRef,
      priority,
      bulkId,
      bulkName,
      buildVariables,
      returnData
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant }
) => {
  const branchName = `pr-${number}`;
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );
  const envType =
    branchName === project.productionEnvironment ? 'production' : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: project.id
  });

  if (project.deploymentsDisabled == 1){
    throw new Error('Deployments have been disabled for this project');
  }

  let buildName = generateBuildId();

  const sourceUser = await Helpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const deployData = {
    type: 'pullrequest',
    projectName: project.name,
    pullrequestTitle: title,
    pullrequestNumber: number,
    headBranchName,
    headSha: headBranchRef,
    baseBranchName,
    baseSha: baseBranchRef,
    branchName,
    buildName: buildName,
    buildPriority: priority,
    bulkId: bulkId,
    bulkName: bulkName,
    buildVariables: buildVariables,
    sourceType: "API",
    sourceUser: sourceUser
  };

  const meta = {
    projectName: project.name,
    pullrequestTitle: deployData.pullrequestTitle
  };

  userActivityLogger(`User triggered a pull-request deployment on '${deployData.projectName}' for '${deployData.branchName}'`, {
    project: '',
    event: 'api:deployEnvironmentPullrequest',
    payload: {
      deployData
    }
  });

  try {
    await createDeployTask(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentPullrequest',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${deployData.branchName}\``
    );

    if (returnData == true) {
      return deployData.buildName;
    }
    return 'success';
  } catch (error) {
    switch (error.name) {
      case 'NoNeedToDeployBranch':
        sendToLagoonLogs(
          'info',
          deployData.projectName,
          '',
          'api:deployEnvironmentPullrequest',
          meta,
          `*[${deployData.projectName}]* Deployment skipped \`${deployData.branchName}\`: ${error.message}`
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentPullrequest:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${deployData.branchName}\`: ${error.message}`
        );
        return `Error: ${error.message}`;
    }
  }
};

export const deployEnvironmentPromote: ResolverFn = async (
  root,
  {
    input: {
      sourceEnvironment: sourceEnvironmentInput,
      project: projectInput,
      destinationEnvironment,
      priority,
      bulkId,
      bulkName,
      buildVariables,
      returnData
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant }
) => {
  const destProject = await projectHelpers(
    sqlClientPool
  ).getProjectByProjectInput(projectInput);
  const envType =
    destinationEnvironment === destProject.productionEnvironment
      ? 'production'
      : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: destProject.id
  });

  if (destProject.deploymentsDisabled == 1){
    throw new Error('Deployments have been disabled for this project');
  }

  const sourceEnvironments = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentsByEnvironmentInput(sourceEnvironmentInput);
  const activeEnvironments = R.filter(
    R.propEq('deleted', '0000-00-00 00:00:00'),
    sourceEnvironments
  );

  if (activeEnvironments.length < 1 || activeEnvironments.length > 1) {
    throw new Error('Unauthorized');
  }

  const sourceEnvironment = R.prop(0, activeEnvironments);

  await hasPermission('environment', 'view', {
    project: sourceEnvironment.project
  });

  let buildName = generateBuildId();

  const sourceUser = await Helpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const deployData = {
    type: 'promote',
    projectName: destProject.name,
    branchName: destinationEnvironment,
    promoteSourceEnvironment: sourceEnvironment.name,
    buildName: buildName,
    buildPriority: priority,
    bulkId: bulkId,
    bulkName: bulkName,
    buildVariables: buildVariables,
    sourceType: "API",
    sourceUser: sourceUser
  };

  const meta = {
    projectName: deployData.projectName,
    branchName: deployData.branchName,
    promoteSourceEnvironment: deployData.promoteSourceEnvironment
  };

  userActivityLogger(`User promoted the environment on '${deployData.projectName}'
    from '${deployData.promoteSourceEnvironment}' to '${deployData.branchName}'`, {
    project: '',
    event: 'api:deployEnvironmentPromote',
    payload: {
      deployData
    }
  });

  try {
    await createPromoteTask(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentPromote',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${deployData.branchName}\``
    );

    if (returnData == true) {
      return deployData.buildName;
    }
    return 'success';
  } catch (error) {
    switch (error.name) {
      case 'NoNeedToDeployBranch':
        sendToLagoonLogs(
          'info',
          deployData.projectName,
          '',
          'api:deployEnvironmentPromote',
          meta,
          `*[${deployData.projectName}]* Deployment skipped \`${deployData.branchName}\`: ${error.message}`
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentPromote:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${deployData.branchName}\`: ${error.message}`
        );
        return `Error: ${error.message}`;
    }
  }
};

export const switchActiveStandby: ResolverFn = async (
  root,
  { input: { project: projectInput } },
  { sqlClientPool, hasPermission, keycloakGrant, legacyGrant }
) => {
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );

  // active/standby really only should be between production environments
  await hasPermission('environment', `deploy:production`, {
    project: project.id
  });

  await hasPermission('task', 'view', {
    project: project.id
  });

  if (project.standbyProductionEnvironment == null) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:switchActiveStandby',
      '',
      `Failed to create active to standby task, reason: no standbyProductionEnvironment configured`
    );
    return `Error: no standbyProductionEnvironment configured`;
  }
  var environmentStandbyId
  var environmentProdId
  var environmentProd
  var environmentStandby
  // we want the task to show in the standby environment, as this is where the task will be initiated.
  try {
    // maybe the environments have slashes in their names
    // get all the environments for this project
    const environmentsForProject = await query(
      sqlClientPool,
      environmentSql.selectEnvironmentsByProjectID(
        project.id, true
      )
    );
    for (const envForProject of environmentsForProject) {
      // check the environments to see if their name when made "safe" matches what is defined in the `production` or `standbyProduction` environment
      if (makeSafe(envForProject.name) == project.productionEnvironment) {
        const environmentRowsProd = await query(
          sqlClientPool,
          environmentSql.selectEnvironmentByNameAndProject(
            envForProject.name,
            project.id
          )
        );
        environmentProd = environmentRowsProd[0];
        environmentProdId = parseInt(environmentProd.id);
      }
      if (makeSafe(envForProject.name) == project.standbyProductionEnvironment) {
        const environmentRows = await query(
          sqlClientPool,
          environmentSql.selectEnvironmentByNameAndProject(
            envForProject.name,
            project.id
          )
        );
        environmentStandby = environmentRows[0];
        environmentStandbyId = parseInt(environmentStandby.id);
      }
    }
  } catch (err) {
    throw new Error(`Unable to determine active standby environments: ${err}`);
  }

  if (environmentStandbyId === undefined || environmentProdId === undefined) {
    throw new Error(`Unable to determine active standby environments`);
  }
  // construct the data for the misc task
  // set up the task data payload
  const data = {
    project: {
      id: project.id,
      name: project.name,
      productionEnvironment: project.productionEnvironment,
      standbyProductionEnvironment: project.standbyProductionEnvironment
    },
    productionEnvironment: {
      id: environmentProdId,
      name: environmentProd.name,
      openshiftProjectName: environmentProd.openshiftProjectName
    },
    environment: {
      id: environmentStandbyId,
      name: environmentStandby.name,
      openshiftProjectName: environmentStandby.openshiftProjectName
    },
    task: {
      id: '0',
      name: 'Active/Standby Switch'
    }
  };

  // try it now
  const sourceUser = await Helpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const sourceType = "API"
  try {
    // add a task into the environment
    var date = new Date();
    var created = convertDateFormat(date.toISOString());
    const sourceTaskData = await addTask(
      'Active/Standby Switch',
      'NEW',
      created,
      environmentStandbyId,
      null,
      null,
      null,
      null,
      '',
      '',
      false,
      sourceUser,
      sourceType,
    );
    data.task.id = sourceTaskData.addTask.id.toString();

    // queue the task to trigger the migration
    await createMiscTask({ key: 'task:activestandby', data });

    // return the task id and remote id
    var retData = {
      id: data.task.id,
      environment: environmentStandbyId
    };
    return retData;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:switchActiveStandby',
      data,
      `Failed to create active to standby task, reason: ${error}`
    );
    return `Error: ${error.message}`;
  }
};

export const bulkDeployEnvironmentLatest: ResolverFn = async (
  _root,
  { input: { environments: environmentsInput, buildVariables, name: bulkName } },
  { keycloakGrant, models, sqlClientPool, hasPermission, userActivityLogger, keycloakUsersGroups }
) => {

    /*
    use the same mechanism for viewing all projects
    bulk deployments can span multiple projects, and anyone with access to a project
    will have the same rbac as `deployment:view` which covers all possible roles for a user
    otherwise it will only return all the projects they have access to
    and the listed deployments are sourced accordingly to which project
    the user has access to
  */
  let userProjectIds: number[];
  try {
    await hasPermission('project', 'viewAll');
  } catch (err) {
    if (!keycloakGrant) {
      logger.debug('No grant available for bulkDeployEnvironmentLatest');
      return [];
    }

    const userProjectRoles = await models.UserModel.getAllProjectsIdsForUser({
      id: keycloakGrant.access_token.content.sub
    }, keycloakUsersGroups);
    userProjectIds = getUserProjectIdsFromRoleProjectIds(userProjectRoles);
  }

  let bulkId = uuid4();

  if (R.isEmpty(environmentsInput)) {
    throw new Error('You must provide environments');
  }

  const environmentsInputNotEmpty = R.filter(R.complement(R.isEmpty), environmentsInput);

  if (R.isEmpty(environmentsInputNotEmpty)) {
    throw new Error('One or more of your environments is missing an id or name');
  }

  // do a permission check on each environment being deployed if the user has a keycloak token (ie, if userProjectIds is populated)
  for (const envInput of environmentsInput) {
    if (userProjectIds) {
      let environmentInput = envInput.environment
      const environments = await environmentHelpers(
        sqlClientPool
      ).getEnvironmentsByEnvironmentInput(environmentInput);
      const activeEnvironments = R.filter(
        R.propEq('deleted', '0000-00-00 00:00:00'),
        environments
      );

      if (activeEnvironments.length < 1 || activeEnvironments.length > 1) {
        throw new Error('Unauthorized');
      }

      const environment = R.prop(0, activeEnvironments);
      const project = await projectHelpers(sqlClientPool).getProjectById(
        environment.project
      );
      // if this is a keycloak token, check that the environments being deployed the user has access to
      await hasPermission('environment', `deploy:${environment.environmentType}`, {
        project: project.id
      });
    }
  }

  // add the priority field if it doesn't exist
  let envs = environmentsInput.map(x => ({ priority: 3, ...x}))

  // sort the environments
  envs.sort(function(a, b) {
    return b.priority - a.priority;
  });

  // otherwise if all the access is fine, then send the action to the actions-handler to be processed
  for (const envInput of envs) {
    // the `data` part of the actionData for a deployEnvironmentLatest is the same as what is in `DeployEnvironmentLatestInput`
    // this is for a 1:1 translation when consuming this in the actions-handler
    let buildPriority = 3;
    // check if the priority has come through for a specific environment
    if (envInput.priority != null) {
      buildPriority = envInput.priority
    }

    // check for buildvariables being passed in from the bulk deploy
    // since it is possible to define specific environment build variables
    // these need to be merged on top of ones that come through at the bulk deploy level
    // handle that here
    let newBuildVariables = buildVariables || [];

    if (envInput.buildVariables != null && buildVariables != null) {
      newBuildVariables = jsonMerge(buildVariables, envInput.buildVariables, "name")
    } else if (envInput.buildVariables != null) {
      newBuildVariables = envInput.buildVariables
    }

    const actionData = {
      type: "deployEnvironmentLatest",
      eventType: "bulkDeployment",
      data: {
        ...envInput,
        bulkId: bulkId,
        bulkName: bulkName,
        priority: buildPriority,
        buildVariables: newBuildVariables
      }
    }
    sendToLagoonActions("deployEnvironmentLatest", actionData)
  }

  userActivityLogger(`User performed a bulk deployment`, {
    payload: {
      bulkId: bulkId,
      bulkName: bulkName
    }
  });

  return bulkId
};

export const deploymentSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.DEPLOYMENT
]);
