import * as R from 'ramda';
import getFieldNames from 'graphql-list-fields';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { createDeployTask, createMiscTask, createPromoteTask } from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import esClient from '../../clients/esClient';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
} from '../../clients/pubSub';
import {
  knex,
  prepare,
  query,
  isPatchEmpty,
} from '../../util/db';
import { Sql } from './sql';
import { Helpers } from './helpers';
import EVENTS from './events';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import {
  addTask,
} from '@lagoon/commons/dist/api';
const convertDateFormat = R.init;
import { Sql as environmentSql } from '../environment/sql';
import { userActivityLogger } from '../../loggers/userActivityLogger';

const deploymentStatusTypeToString = R.cond([
  [R.equals('NEW'), R.toLower],
  [R.equals('PENDING'), R.toLower],
  [R.equals('RUNNING'), R.toLower],
  [R.equals('CANCELLED'), R.toLower],
  [R.equals('ERROR'), R.toLower],
  [R.equals('FAILED'), R.toLower],
  [R.equals('COMPLETE'), R.toLower],
  [R.T, R.identity],
]);

const injectBuildLog = async deployment => {
  if (!deployment.remoteId) {
    return {
      ...deployment,
      buildLog: null,
    };
  }

  try {
    const result = await esClient.search({
      index: 'lagoon-logs-*',
      sort: '@timestamp:desc',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { 'meta.remoteId': deployment.remoteId } },
              { match_phrase: { 'meta.buildPhase': deployment.status } },
            ],
          },
        },
      },
    });

    if (!result.hits.total) {
      return {
        ...deployment,
        buildLog: null,
      };
    }

    return {
      ...deployment,
      buildLog: R.path(['hits', 'hits', 0, '_source', 'message'], result),
    };
  } catch (e) {
    return {
      ...deployment,
      buildLog: `There was an error loading the logs: ${e.message}`,
    };
  }
};

export const getDeploymentsByEnvironmentId: ResolverFn = async (
  { id: eid },
  { name },
  {
    sqlClient,
    hasPermission,
  },
  info,
) => {
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(eid);
  await hasPermission('deployment', 'view', {
    project: environment.project,
  });

  const prep = prepare(
    sqlClient,
    `SELECT
        d.*
      FROM environment e
      JOIN deployment d on e.id = d.environment
      JOIN project p ON e.project = p.id
      WHERE e.id = :eid
    `,
  );

  const rows = await query(sqlClient, prep({ eid })) as any[];
  const newestFirst = R.sort(R.descend(R.prop('created')), rows);

  const requestedFields = getFieldNames(info);

  return newestFirst
    .filter(row => {
      if (R.isNil(name) || R.isEmpty(name)) {
        return true;
      }

      return row.name === name;
    })
    .map(row => {
      if (R.contains('buildLog', requestedFields)) {
        return injectBuildLog(row);
      }

      return {
        ...row,
        buildLog: null,
      };
    });
};

export const getDeploymentByRemoteId: ResolverFn = async (
  root,
  { id },
  {
    sqlClient,
    hasPermission,
  },
) => {
  const queryString = knex('deployment')
    .where('remote_id', '=', id)
    .toString();

  const rows = await query(sqlClient, queryString);
  const deployment = R.prop(0, rows);

  if (!deployment) {
    return null;
  }

  const perms = await query(
    sqlClient,
    Sql.selectPermsForDeployment(deployment.id),
  );

  await hasPermission('deployment', 'view', {
    project: R.path(['0', 'pid'], perms),
  });

  return injectBuildLog(deployment);
};

export const getDeploymentUrl: ResolverFn = async (
  { id, environment },
  args,
  { sqlClient, hasPermission },
) => {

  const defaultUiUrl = R.propOr('http://localhost:8888', 'UI_URL', process.env);

  const lagoonUiRoute = R.compose(
    R.defaultTo(defaultUiUrl),
    R.find(R.test(/\/ui-/)),
    R.split(','),
    R.propOr('', 'LAGOON_ROUTES'),
  )(process.env);

  const { name: project, openshiftProjectName  } = await projectHelpers(sqlClient).getProjectByEnvironmentId(
    environment,
  );

  const rows = await query(sqlClient, knex('deployment').where('id', '=', id).toString());
  const deployment = R.prop(0, rows);

  return `${lagoonUiRoute}/projects/${project}/${openshiftProjectName}/deployments/${deployment.name}`;
};

export const addDeployment: ResolverFn = async (
  root,
  {
    input: {
      id,
      name,
      status: unformattedStatus,
      created,
      started,
      completed,
      environment: environmentId,
      remoteId,
    },
  },
  {
    sqlClient,
    hasPermission,
    keycloakGrant,
    legacyCredentials,
    requestHeaders
  },
) => {
  const status = deploymentStatusTypeToString(unformattedStatus);

  const environment = await environmentHelpers(sqlClient).getEnvironmentById(environmentId);
  await hasPermission('environment', `deploy:${environment.environmentType}`, {
    project: environment.project,
  });

  const {
    info: { insertId },
  } = await query(
    sqlClient,
    Sql.insertDeployment({
      id,
      name,
      status,
      created,
      started,
      completed,
      environment: environmentId,
      remoteId,
    }),
  );

  const rows = await query(sqlClient, Sql.selectDeployment(insertId));
  const deployment = await injectBuildLog(R.prop(0, rows));

  userActivityLogger.user_action(`User deployed '${name}' to '${environment.project}'`, {
    user: keycloakGrant || legacyCredentials,
    headers: requestHeaders,
    payload: {
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      remoteId,
    }
  });

  pubSub.publish(EVENTS.DEPLOYMENT.ADDED, deployment);
  return deployment;
};

export const deleteDeployment: ResolverFn = async (
  root,
  { input: { id } },
  {
    sqlClient,
    hasPermission,
    keycloakGrant,
    legacyCredentials,
    requestHeaders
  },
) => {
  const perms = await query(sqlClient, Sql.selectPermsForDeployment(id));

  await hasPermission('deployment', 'delete', {
    project: R.path(['0', 'pid'], perms),
  });

  await query(sqlClient, Sql.deleteDeployment(id));

  userActivityLogger.user_action(`User deleted deployment '${id}'`, {
    user: keycloakGrant || legacyCredentials,
    headers: requestHeaders,
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
        status: unformattedStatus,
        created,
        started,
        completed,
        environment,
        remoteId,
      },
    },
  },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const status = deploymentStatusTypeToString(unformattedStatus);

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  const permsDeployment = await query(sqlClient, Sql.selectPermsForDeployment(id));

  // Check access to modify deployment as it currently stands
  await hasPermission('deployment', 'update', {
    project: R.path(['0', 'pid'], permsDeployment),
  });

  if (environment) {
    const permsEnv = await environmentHelpers(sqlClient).getEnvironmentById(environment);
    // Check access to modify deployment as it will be updated
    await hasPermission('environment', 'view', {
      project: permsEnv.project,
    });
  }

  await query(
    sqlClient,
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
      },
    }),
  );

  const rows = await query(sqlClient, Sql.selectDeployment(id));
  const deployment = await injectBuildLog(R.prop(0, rows));

  pubSub.publish(EVENTS.DEPLOYMENT.UPDATED, deployment);

  userActivityLogger.user_action(`User updated deployment '${id}'`, {
    user: keycloakGrant || legacyCredentials,
    headers: requestHeaders,
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
      }
    }
  });

  return deployment;
};

export const cancelDeployment: ResolverFn = async (
  root,
  { input: { deployment: deploymentInput } },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const deployment = await Helpers(sqlClient).getDeploymentByDeploymentInput(deploymentInput);
  const environment = await environmentHelpers(sqlClient).getEnvironmentById(deployment.environment);
  const project = await projectHelpers(sqlClient).getProjectById(
    environment.project,
  );

  await hasPermission('deployment', 'cancel', {
    project: project.id,
  });

  const data = {
    build: deployment,
    environment,
    project,
  };

  try {
    await createMiscTask({ key: 'build:cancel', data });

    userActivityLogger.user_action(`User canceled deployment for '${deployment.environment}'`, {
      user: keycloakGrant || legacyCredentials,
      headers: requestHeaders,
      payload: {
        deploymentInput,
        data: data.build
      }
    });

    return 'success';
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:cancelDeployment',
      { deploymentId: deployment.id },
      `Deployment not cancelled, reason: ${error}`,
    );
    return `Error: ${error.message}`;
  }
};

export const deployEnvironmentLatest: ResolverFn = async (
  root,
  { input: { environment: environmentInput } },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const environments = await environmentHelpers(
    sqlClient,
  ).getEnvironmentsByEnvironmentInput(environmentInput);
  const activeEnvironments = R.filter(
    R.propEq('deleted', '0000-00-00 00:00:00'),
    environments,
  );

  if (activeEnvironments.length < 1 || activeEnvironments.length > 1) {
    throw new Error('Unauthorized');
  }

  const environment = R.prop(0, activeEnvironments);
  const project = await projectHelpers(sqlClient).getProjectById(
    environment.project,
  );

  await hasPermission('environment', `deploy:${environment.environmentType}`, {
    project: project.id,
  });

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
        'Cannot deploy: deployBaseRef, deployHeadRef or deployTitle is empty',
      );
    }
  }

  let deployData: {
    [key: string]: any
  } = {
    projectName: project.name,
    type: environment.deployType,
  };
  let meta: {
    [key: string]: any
  } = {
    projectName: project.name,
  };
  let taskFunction;
  switch (environment.deployType) {
    case 'branch':
      deployData = {
        ...deployData,
        branchName: environment.deployBaseRef,
      };
      meta = {
        ...meta,
        branchName: deployData.branchName,
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
        branchName: environment.name,
      };
      meta = {
        ...meta,
        pullrequestTitle: deployData.pullrequestTitle,
      };
      taskFunction = createDeployTask;
      break;

    case 'promote':
      deployData = {
        ...deployData,
        branchName: environment.name,
        promoteSourceEnvironment: environment.deployBaseRef,
      };
      meta = {
        ...meta,
        branchName: deployData.branchName,
        promoteSourceEnvironment: deployData.promoteSourceEnvironment,
      };
      taskFunction = createPromoteTask;
      break;

    default:
      return `Error: Unknown deploy type ${environment.deployType}`;
  }

  try {
    await taskFunction(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentLatest',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${
        environment.name
      }\``,
    );

    userActivityLogger.user_action(`User triggered deployment on '${deployData.projectName}' for '${environment.name}'`, {
      user: keycloakGrant || legacyCredentials,
      headers: requestHeaders,
      payload: {
        deployData
      }
    });

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
          `*[${deployData.projectName}]* Deployment skipped \`${
            environment.name
          }\`: ${error.message}`,
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentLatest:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${
            environment.name
          }\`: ${error.message}`,
        );
        return `Error: ${error.message}`;
    }
  }
};

export const deployEnvironmentBranch: ResolverFn = async (
  root,
  { input: { project: projectInput, branchName, branchRef } },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );
  const envType = branchName === project.productionEnvironment ? 'production' : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: project.id,
  });

  const deployData = {
    type: 'branch',
    projectName: project.name,
    branchName,
    sha: branchRef,
  };

  const meta = {
    projectName: project.name,
    branchName: deployData.branchName,
  };

  try {
    await createDeployTask(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentBranch',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${
        deployData.branchName
      }\``,
    );

    userActivityLogger.user_action(`User triggered a deployment on '${deployData.projectName}' for '${deployData.branchName}'`, {
      user: keycloakGrant || legacyCredentials,
      headers: requestHeaders,
      payload: {
        deployData
      }
    });

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
          `*[${deployData.projectName}]* Deployment skipped \`${
            deployData.branchName
          }\`: ${error.message}`,
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentBranch:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${
            deployData.branchName
          }\`: ${error}`,
        );
        console.log(error);
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
    },
  },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const branchName = `pr-${number}`;
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );
  const envType = branchName === project.productionEnvironment ? 'production' : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: project.id,
  });

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
  };

  const meta = {
    projectName: project.name,
    pullrequestTitle: deployData.pullrequestTitle,
  };

  try {
    await createDeployTask(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentPullrequest',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${
        deployData.branchName
      }\``,
    );

    userActivityLogger.user_action(`User triggered a pull-request deployment on '${deployData.projectName}' for '${deployData.branchName}'`, {
      user: keycloakGrant || legacyCredentials,
      headers: requestHeaders,
      payload: {
        deployData
      }
    });

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
          `*[${deployData.projectName}]* Deployment skipped \`${
            deployData.branchName
          }\`: ${error.message}`,
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentPullrequest:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${
            deployData.branchName
          }\`: ${error.message}`,
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
    },
  },
  {
    sqlClient, hasPermission, keycloakGrant, legacyCredentials, requestHeaders
  },
) => {
  const destProject = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );
  const envType = destinationEnvironment === destProject.productionEnvironment ? 'production' : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: destProject.id,
  });

  const sourceEnvironments = await environmentHelpers(
    sqlClient,
  ).getEnvironmentsByEnvironmentInput(sourceEnvironmentInput);
  const activeEnvironments = R.filter(
    R.propEq('deleted', '0000-00-00 00:00:00'),
    sourceEnvironments,
  );

  if (activeEnvironments.length < 1 || activeEnvironments.length > 1) {
    throw new Error('Unauthorized');
  }

  const sourceEnvironment = R.prop(0, activeEnvironments);

  await hasPermission('environment', 'view', {
    project: sourceEnvironment.project
  });

  const deployData = {
    type: 'promote',
    projectName: destProject.name,
    branchName: destinationEnvironment,
    promoteSourceEnvironment: sourceEnvironment.name,
  };

  const meta = {
    projectName: deployData.projectName,
    branchName: deployData.branchName,
    promoteSourceEnvironment: deployData.promoteSourceEnvironment,
  };

  try {
    await createPromoteTask(deployData);

    sendToLagoonLogs(
      'info',
      deployData.projectName,
      '',
      'api:deployEnvironmentPromote',
      meta,
      `*[${deployData.projectName}]* Deployment triggered \`${
        deployData.branchName
      }\``,
    );

    userActivityLogger.user_action(`User promoted the environment on '${deployData.projectName}' from '${deployData.promoteSourceEnvironment}' to '${deployData.branchName}'`, {
      user: keycloakGrant || legacyCredentials,
      headers: requestHeaders,
      payload: {
        deployData
      }
    });

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
          `*[${deployData.projectName}]* Deployment skipped \`${
            deployData.branchName
          }\`: ${error.message}`,
        );
        return `Skipped: ${error.message}`;

      default:
        sendToLagoonLogs(
          'error',
          deployData.projectName,
          '',
          'api:deployEnvironmentPromote:error',
          meta,
          `*[${deployData.projectName}]* Error deploying \`${
            deployData.branchName
          }\`: ${error.message}`,
        );
        return `Error: ${error.message}`;
    }
  }
};

export const switchActiveStandby: ResolverFn = async (
  root,
  {
    input: {
      project: projectInput,
    },
  },
  {
    sqlClient,
    hasPermission,
  },
) => {
  const project = await projectHelpers(sqlClient).getProjectByProjectInput(
    projectInput,
  );

  // active/standby really only should be between production environments
  await hasPermission('environment', `deploy:production`, {
    project: project.id,
  });

  await hasPermission('task', 'view', {
    project: project.id,
  });

  if (project.standbyProductionEnvironment == null) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:switchActiveStandby',
      '',
      `Failed to create active to standby task, reason: no standbyProductionEnvironment configured`,
    );
    return `Error: no standbyProductionEnvironment configured`;
  }

  // we want the task to show in the standby environment, as this is where the task will be initiated.
  const environmentRows = await query(
    sqlClient,
    environmentSql.selectEnvironmentByNameAndProject(project.standbyProductionEnvironment, project.id),
  );
  const environment = environmentRows[0];
  var environmentId = parseInt(environment.id);
  // we need to pass some additional information about the production environment
  const environmentRowsProd = await query(
    sqlClient,
    environmentSql.selectEnvironmentByNameAndProject(project.productionEnvironment, project.id),
  );
  const environmentProd = environmentRowsProd[0];
  var environmentProdId = parseInt(environmentProd.id);

  // construct the data for the misc task
  // set up the task data payload
  const data = {
    project: {
      id: project.id,
      name: project.name,
      productionEnvironment: project.productionEnvironment,
      standbyProductionEnvironment: project.standbyProductionEnvironment,
    },
    productionEnvironment: {
      id: environmentProdId,
      name: environmentProd.name,
      openshiftProjectName: environmentProd.openshiftProjectName,
    },
    environment: {
      id: environmentId,
      name: environment.name,
      openshiftProjectName: environment.openshiftProjectName,
    },
    task: {
      id: "0",
      name: "Active/Standby Switch",
    }
  };

  // try it now
  try {
    // add a task into the environment
    var date = new Date()
    var created = convertDateFormat(date.toISOString())
    const sourceTaskData = await addTask(
      'Active/Standby Switch',
      'ACTIVE',
      created,
      environmentId,
      null,
      null,
      null,
      null,
      '',
      '',
      false,
    );
    data.task.id = sourceTaskData.addTask.id.toString()

    // queue the task to trigger the migration
    await createMiscTask({ key: 'route:migrate', data });

    // return the task id and remote id
    var retData = {
      id: data.task.id,
      environment: environmentId,
    }
    return retData;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:switchActiveStandby',
      data,
      `Failed to create active to standby task, reason: ${error}`,
    );
    return `Error: ${error.message}`;
  }
};

export const deploymentSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.DEPLOYMENT.ADDED,
  EVENTS.DEPLOYMENT.UPDATED,
]);
