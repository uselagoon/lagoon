// @flow

const R = require('ramda');
const getFieldNames = require('graphql-list-fields');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const {
  createDeployTask,
  createPromoteTask,
} = require('@lagoon/commons/src/tasks');
const esClient = require('../../clients/esClient');
const {
  pubSub,
  createEnvironmentFilteredSubscriber,
} = require('../../clients/pubSub');
const {
  knex,
  prepare,
  query,
  isPatchEmpty,
} = require('../../util/db');
const Sql = require('./sql');
const EVENTS = require('./events');
const environmentHelpers = require('../environment/helpers');
const projectHelpers = require('../project/helpers');

/* ::

import type {ResolversObj} from '../';

*/

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

const getDeploymentsByEnvironmentId = async (
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

  const rows = await query(sqlClient, prep({ eid }));
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

const getDeploymentByRemoteId = async (
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

const addDeployment = async (
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

  pubSub.publish(EVENTS.DEPLOYMENT.ADDED, deployment);
  return deployment;
};

const deleteDeployment = async (
  root,
  { input: { id } },
  {
    sqlClient,
    hasPermission,
  },
) => {
  const perms = await query(sqlClient, Sql.selectPermsForDeployment(id));

  await hasPermission('deployment', 'delete', {
    project: R.path(['0', 'pid'], perms),
  });

  await query(sqlClient, Sql.deleteDeployment(id));

  return 'success';
};

const updateDeployment = async (
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
    sqlClient,
    hasPermission,
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

  return deployment;
};

const deployEnvironmentLatest = async (
  root,
  { input: { environment: environmentInput } },
  {
    sqlClient,
    hasPermission,
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

  let deployData = {
    projectName: project.name,
    type: environment.deployType,
  };
  let meta = {
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
      return `Error: Unkown deploy type ${environment.deployType}`;
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

const deployEnvironmentBranch = async (
  root,
  { input: { project: projectInput, branchName, branchRef } },
  {
    sqlClient,
    hasPermission,
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
          }\`: ${error.message}`,
        );
        return `Error: ${error.message}`;
    }
  }
};

const deployEnvironmentPullrequest = async (
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
    sqlClient,
    hasPermission,
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

const deployEnvironmentPromote = async (
  root,
  {
    input: {
      sourceEnvironment: sourceEnvironmentInput,
      project: projectInput,
      destinationEnvironment,
    },
  },
  {
    sqlClient,
    hasPermission,
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
    project: sourceEnvironment.project,
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

const deploymentSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.DEPLOYMENT.ADDED,
  EVENTS.DEPLOYMENT.UPDATED,
]);

const Resolvers /* : ResolversObj */ = {
  getDeploymentsByEnvironmentId,
  getDeploymentByRemoteId,
  addDeployment,
  deleteDeployment,
  updateDeployment,
  deployEnvironmentLatest,
  deployEnvironmentBranch,
  deployEnvironmentPullrequest,
  deployEnvironmentPromote,
  deploymentSubscriber,
};

module.exports = Resolvers;
