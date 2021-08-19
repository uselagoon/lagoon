import * as R from 'ramda';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import {
  createDeployTask,
  createMiscTask,
  createPromoteTask
} from '@lagoon/commons/dist/tasks';
import { ResolverFn } from '../';
import { esClient } from '../../clients/esClient';
import {
  pubSub,
  createEnvironmentFilteredSubscriber
} from '../../clients/pubSub';
import { getConfigFromEnv, getLagoonRouteFromEnv } from '../../util/config';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { Helpers } from './helpers';
import { EVENTS } from './events';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { addTask } from '@lagoon/commons/dist/api';
import { Sql as environmentSql } from '../environment/sql';

const convertDateFormat = R.init;

export const getBuildLog: ResolverFn = async (
  { remoteId, status },
  _args,
  _context
) => {
  if (!remoteId) {
    return null;
  }

  try {
    const result = await esClient.search({
      index: 'lagoon-logs-*',
      sort: '@timestamp:desc',
      body: {
        query: {
          bool: {
            must: [
              { match_phrase: { 'meta.remoteId': remoteId } },
              { match_phrase: { 'meta.buildPhase': status } }
            ]
          }
        }
      }
    });

    if (!result.hits.total) {
      return null;
    }

    return R.path(['hits', 'hits', 0, '_source', 'message'], result);
  } catch (e) {
    return `There was an error loading the logs: ${e.message}`;
  }
};

export const getDeploymentsByEnvironmentId: ResolverFn = async (
  { id: eid },
  { name, limit },
  { sqlClientPool, hasPermission }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);
  await hasPermission('deployment', 'view', {
    project: environment.project
  });

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
      remoteId
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(environmentId);
  await hasPermission('environment', `deploy:${environment.environmentType}`, {
    project: environment.project
  });

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
      remoteId
    })
  );

  const rows = await query(sqlClientPool, Sql.selectDeployment(insertId));
  const deployment = R.prop(0, rows);

  pubSub.publish(EVENTS.DEPLOYMENT.ADDED, deployment);
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

  userActivityLogger.user_action(`User deleted deployment '${id}'`, {
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
        remoteId
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
        remoteId
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectDeployment(id));
  const deployment = R.prop(0, rows);

  pubSub.publish(EVENTS.DEPLOYMENT.UPDATED, deployment);

  userActivityLogger.user_action(`User updated deployment '${id}'`, {
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
        remoteId
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

  userActivityLogger.user_action(
    `User cancelled deployment for '${deployment.environment}'`,
    {
      project: '',
      event: 'api:cancelDeployment',
      payload: {
        deploymentInput,
        data: data.build
      }
    }
  );

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
  { input: { environment: environmentInput } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
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

  let deployData: {
    [key: string]: any;
  } = {
    projectName: project.name,
    type: environment.deployType
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
        pullrequestTitle: deployData.pullrequestTitle
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

  userActivityLogger.user_action(
    `User triggered a deployment on '${deployData.projectName}' for '${environment.name}'`,
    {
      project: deployData.projectName || '',
      event: 'api:deployEnvironmentLatest',
      payload: {
        deployData
      }
    }
  );

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
  { input: { project: projectInput, branchName, branchRef } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const project = await projectHelpers(sqlClientPool).getProjectByProjectInput(
    projectInput
  );
  const envType =
    branchName === project.productionEnvironment ? 'production' : 'development';

  await hasPermission('environment', `deploy:${envType}`, {
    project: project.id
  });

  const deployData = {
    type: 'branch',
    projectName: project.name,
    branchName,
    sha: branchRef
  };

  const meta = {
    projectName: project.name,
    branchName: deployData.branchName
  };

  userActivityLogger.user_action(
    `User triggered a deployment on '${deployData.projectName}' for '${deployData.branchName}'`,
    {
      project: deployData.projectName || '',
      event: 'api:deployEnvironmentBranch',
      payload: {
        deployData
      }
    }
  );

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
      headBranchRef
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
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

  const deployData = {
    type: 'pullrequest',
    projectName: project.name,
    pullrequestTitle: title,
    pullrequestNumber: number,
    headBranchName,
    headSha: headBranchRef,
    baseBranchName,
    baseSha: baseBranchRef,
    branchName
  };

  const meta = {
    projectName: project.name,
    pullrequestTitle: deployData.pullrequestTitle
  };

  userActivityLogger.user_action(
    `User triggered a pull-request deployment on '${deployData.projectName}' for '${deployData.branchName}'`,
    {
      project: deployData.projectName || '',
      event: 'api:deployEnvironmentPullrequest',
      payload: {
        deployData
      }
    }
  );

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
      destinationEnvironment
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
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

  const deployData = {
    type: 'promote',
    projectName: destProject.name,
    branchName: destinationEnvironment,
    promoteSourceEnvironment: sourceEnvironment.name
  };

  const meta = {
    projectName: deployData.projectName,
    branchName: deployData.branchName,
    promoteSourceEnvironment: deployData.promoteSourceEnvironment
  };

  userActivityLogger.user_action(
    `User promoted the environment on '${deployData.projectName}' from '${deployData.promoteSourceEnvironment}' to '${deployData.branchName}'`,
    {
      project: deployData.projectName || '',
      event: 'api:deployEnvironmentPromote',
      payload: {
        deployData
      }
    }
  );

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
  { sqlClientPool, hasPermission }
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

  // we want the task to show in the standby environment, as this is where the task will be initiated.
  const environmentRows = await query(
    sqlClientPool,
    environmentSql.selectEnvironmentByNameAndProject(
      project.standbyProductionEnvironment,
      project.id
    )
  );
  const environment = environmentRows[0];
  var environmentId = parseInt(environment.id);
  // we need to pass some additional information about the production environment
  const environmentRowsProd = await query(
    sqlClientPool,
    environmentSql.selectEnvironmentByNameAndProject(
      project.productionEnvironment,
      project.id
    )
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
      standbyProductionEnvironment: project.standbyProductionEnvironment
    },
    productionEnvironment: {
      id: environmentProdId,
      name: environmentProd.name,
      openshiftProjectName: environmentProd.openshiftProjectName
    },
    environment: {
      id: environmentId,
      name: environment.name,
      openshiftProjectName: environment.openshiftProjectName
    },
    task: {
      id: '0',
      name: 'Active/Standby Switch'
    }
  };

  // try it now
  try {
    // add a task into the environment
    var date = new Date();
    var created = convertDateFormat(date.toISOString());
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
      false
    );
    data.task.id = sourceTaskData.addTask.id.toString();

    // queue the task to trigger the migration
    await createMiscTask({ key: 'route:migrate', data });

    // return the task id and remote id
    var retData = {
      id: data.task.id,
      environment: environmentId
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

export const deploymentSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.DEPLOYMENT.ADDED,
  EVENTS.DEPLOYMENT.UPDATED
]);
