import * as R from 'ramda';
import { ResolverFn } from '../';
import {
  pubSub,
  createEnvironmentFilteredSubscriber,
  EVENTS
} from '../../clients/pubSub';
import { knex, query, isPatchEmpty } from '../../util/db';
import { Sql } from './sql';
import { Helpers } from './helpers';
import { Filters } from './filters';
import { Helpers as environmentHelpers } from '../environment/helpers';
import { Helpers as projectHelpers } from '../project/helpers';
import { Helpers as deploymentHelpers } from '../deployment/helpers';
import { Validators as envValidators } from '../environment/validators';
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
import sha1 from 'sha1';
import { generateTaskName } from '@lagoon/commons/dist/util/lagoon';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { createMiscTask } from '@lagoon/commons/dist/tasks';
import { TaskSourceType, AuditType } from '@lagoon/commons/dist/types';
import { AuditLog } from '../audit/types';
import { HistoryRetentionEnforcer } from '../retentionpolicy/history';

const accessKeyId =  process.env.S3_FILES_ACCESS_KEY_ID || 'minio'
const secretAccessKey =  process.env.S3_FILES_SECRET_ACCESS_KEY || 'minio123'
const bucket = process.env.S3_FILES_BUCKET || 'lagoon-files'
const region = process.env.S3_FILES_REGION || 'us-east-1'
const s3Origin = process.env.S3_FILES_HOST || 'http://docker.for.mac.localhost:9000'

const config = {
  origin: s3Origin,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
  region: region,
  bucket: bucket
};

const s3Client = new S3Client({
  endpoint: config.origin,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
  region: config.region,
  forcePathStyle: true
});

export const getTaskLog: ResolverFn = async (
  { remoteId, environment, id, status },
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
    // where it should be, check `tasklogs/projectName/environmentName/taskId-remoteId.txt`
    let taskLog = 'tasklogs/'+projectData.name+'/'+environmentName+'/'+id+'-'+remoteId+'.txt'
    const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: taskLog }));
    const data = await response.Body.transformToString('utf-8');

    if (!data) {
      return null;
    }

    return data;
  } catch (e) {
    // if it isn't where it should be, check the fallback location which will be `tasklogs/projectName/taskId-remoteId.txt`
    try {
      let taskLog = 'tasklogs/'+projectData.name+'/'+id+'-'+remoteId+'.txt'
      const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: taskLog }));
      const data = await response.Body.transformToString('utf-8');

      if (!data) {
        return null;
      }

      return data;
    } catch (e) {
      // otherwise there is no log to show the user
      return `There was an error loading the logs: ${e.message}\nIf this error persists, contact your Lagoon support team.`;
    }
  }
};

export const getTasksByEnvironmentId: ResolverFn = async (
  { id: eid },
  { id: filterId, taskName: taskName, limit },
  { sqlClientPool, hasPermission, adminScopes }
) => {
  const environment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(eid);

  // if the user is not a platform owner or viewer, then perform normal permission check
  if (!adminScopes.platformOwner && !adminScopes.platformViewer) {
    await hasPermission('task', 'view', {
      project: environment.project
    });
  }

  let queryBuilder = knex('task')
    .where('environment', eid)
    .orderBy('created', 'desc')
    .orderBy('id', 'desc');

  if (filterId) {
    queryBuilder = queryBuilder.andWhere('id', filterId);
  }

  if (taskName) {
    queryBuilder = queryBuilder.andWhere('task_name', taskName);
  }

  if (limit) {
    queryBuilder = queryBuilder.limit(limit);
  }

  let rows = await query(sqlClientPool, queryBuilder.toString())
  rows = await Filters.filterAdminTasks(hasPermission, rows);

  return rows;
};

export const getTaskByTaskName: ResolverFn = async (
  root,
  { taskName },
  { sqlClientPool, hasPermission }
) => {
  const queryString = knex('task')
    .where('task_name', '=', taskName)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const task = R.prop(0, rows);

  if (!task) {
    return null;
  }

  const rowsPerms = await query(sqlClientPool, Sql.selectPermsForTask(task.id));
  if (R.path(['0', 'admin_only_view'], rowsPerms)) {
    await hasPermission('project', 'viewAll');
  } else {
    await hasPermission('task', 'view', {
      project: R.path(['0', 'pid'], rowsPerms)
    });
  }

  return task;
};

export const getTaskByRemoteId: ResolverFn = async (
  root,
  { id },
  { sqlClientPool, hasPermission }
) => {
  const queryString = knex('task')
    .where('remote_id', '=', id)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const task = R.prop(0, rows);

  if (!task) {
    return null;
  }

  const rowsPerms = await query(sqlClientPool, Sql.selectPermsForTask(task.id));
  if (R.path(['0', 'admin_only_view'], rowsPerms)) {
    await hasPermission('project', 'viewAll');
  } else {
    await hasPermission('task', 'view', {
      project: R.path(['0', 'pid'], rowsPerms)
    });
  }

  return task;
};

export const getTaskById: ResolverFn = async (
  root,
  { id },
  { sqlClientPool, hasPermission }
) => {
  const queryString = knex('task')
    .where('id', '=', id)
    .toString();

  const rows = await query(sqlClientPool, queryString);
  const task = R.prop(0, rows);

  if (!task) {
    return null;
  }

  const rowsPerms = await query(sqlClientPool, Sql.selectPermsForTask(task.id));
  if (R.path(['0', 'admin_only_view'], rowsPerms)) {
    await hasPermission('project', 'viewAll');
  } else {
    await hasPermission('task', 'view', {
      project: R.path(['0', 'pid'], rowsPerms)
    });
  }

  return task;
};

export const addTask: ResolverFn = async (
  root,
  {
    input: {
      id,
      name,
      status,
      created,
      started,
      completed,
      environment,
      service,
      command,
      remoteId,
      deployTokenInjection,
      projectKeyInjection,
      adminOnlyView,
      execute: executeRequest,
      sourceType,
      sourceUser,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(environment);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environment
  );
  await hasPermission('task', `add:${envPerm.environmentType}`, {
    project: envPerm.project
  });

  let execute;
  try {
    await hasPermission('task', 'addNoExec', {
      project: envPerm.project
    });
    execute = executeRequest;
  } catch (err) {
    execute = true;
  }

  let taskName = generateTaskName()

  sourceUser ??= await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  sourceType ??= TaskSourceType.API

  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    id,
    name,
    taskName,
    status,
    created,
    started,
    completed,
    environment,
    service,
    command,
    remoteId,
    deployTokenInjection,
    projectKeyInjection,
    adminOnlyView,
    execute,
    sourceUser,
    sourceType
  });

  const auditLog: AuditLog = {
    resource: {
      id: environment.id,
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: taskData.name,
    },
  };
  userActivityLogger(`User added task '${name}'`, {
    project: '',
    event: 'api:addTask',
    payload: {
      input: {
        id,
        name,
        taskName,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        remoteId,
        execute: executeRequest,
        sourceUser,
        sourceType,
      },
      ...auditLog,
    }
  });

  return taskData;
};

export const deleteTask: ResolverFn = async (
  root,
  { input: { id } },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  const rows = await query(sqlClientPool, Sql.selectPermsForTask(id));
  await hasPermission('task', 'delete', {
    project: R.path(['0', 'pid'], rows)
  });

  const task = await Helpers(sqlClientPool, hasPermission).getTaskByTaskInput({id: id})

  if (!task) {
    throw new Error(
      `Invalid task input`
    );
  }

  const environmentData = await environmentHelpers(sqlClientPool).getEnvironmentById(parseInt(task.environment));
  const projectData = await projectHelpers(sqlClientPool).getProjectById(environmentData.project);

  await query(sqlClientPool, Sql.deleteTask(id));

  // pass the task to the HistoryRetentionEnforcer
  await HistoryRetentionEnforcer().cleanupTask(projectData, environmentData, task)

  const auditLog: AuditLog = {
    resource: {
      id: id,
      type: AuditType.TASK,
    },
  };
  userActivityLogger(`User deleted task '${id}'`, {
    project: '',
    event: 'api:deleteTask',
    payload: {
      input: {
        id
      },
      ...auditLog,
    }
  });

  return 'success';
};

export const cancelTask: ResolverFn = async (
  root,
  {
    input: {
      task: taskInput,
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger, adminScopes }
) => {

  const task = await Helpers(sqlClientPool, hasPermission, adminScopes).getTaskByTaskInput(taskInput);
  if (!task) {
    return null;
  }

  const environment = await environmentHelpers(sqlClientPool).getEnvironmentById(task.environment);
  const project = await projectHelpers(sqlClientPool).getProjectById(environment.project);

  await hasPermission('task', `cancel:${environment.environmentType}`, {
    project: project.id
  });


  const data = {
    task: {
      id: task.id.toString(),
      name: task.name,
      taskName: task.taskName,
      service: task.service,
    },
    environment,
    project
  };

  const auditLog: AuditLog = {
    resource: {
      id: environment.id,
      type: AuditType.ENVIRONMENT,
      details: environment.name,
    },
    linkedResource: {
      id: task.id,
      type: AuditType.TASK,
      details: task.name,
    },
  };
  userActivityLogger(
    `User cancelled task for '${task.environment}'`,
    {
      project: '',
      event: 'api:cancelDeployment',
      payload: {
        taskInput,
        data: data.task,
        ...auditLog,
      }
    }
  );

  try {
    await createMiscTask({ key: 'task:cancel', data });
    return 'success';
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      '',
      'api:cancelTask',
      { taskId: task.id },
      `Task not cancelled, reason: ${error}`
    );
    return `Error: ${error.message}`;
  }
};

export const updateTask: ResolverFn = async (
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
        service,
        command,
        deployTokenInjection,
        remoteId
      }
    }
  },
  { sqlClientPool, hasPermission, userActivityLogger }
) => {
  // Check access to modify task as it currently stands
  const curPerms = await query(sqlClientPool, Sql.selectPermsForTask(id));
  await hasPermission('task', 'update', {
    project: R.path(['0', 'pid'], curPerms)
  });

  const task = await query(sqlClientPool, Sql.selectTask(id));
  const env = await environmentHelpers(sqlClientPool).getEnvironmentById(
    task[0].environment
  );

  if (environment) {
    // Check access to modify task as it will be updated
    const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
      environment
    );
    await hasPermission('task', 'update', {
      project: envPerm.project
    });
  }

  if (isPatchEmpty({ patch })) {
    throw new Error('Input patch requires at least 1 attribute');
  }

  await query(
    sqlClientPool,
    Sql.updateTask({
      id,
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        deployTokenInjection,
        remoteId
      }
    })
  );

  const rows = await query(sqlClientPool, Sql.selectTask(id));
  const taskData = R.prop(0, rows);

  pubSub.publish(EVENTS.TASK, taskData);

  const auditLog: AuditLog = {
    resource: {
      id: env.id,
      type: AuditType.ENVIRONMENT,
      details: env.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: taskData.name,
    },
  };
  userActivityLogger(`User updated task '${id}'`, {
    project: '',
    event: 'api:updateTask',
    payload: {
      patch: {
        name,
        status,
        created,
        started,
        completed,
        environment,
        service,
        command,
        deployTokenInjection,
        remoteId
      },
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushArchiveDump: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushArchiveDump:${envPerm.environmentType}`, {
    project: envPerm.project
  });
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );

  const command = String.raw`file="/tmp/$LAGOON_PROJECT-$LAGOON_GIT_SAFE_BRANCH-$(date --iso-8601=seconds).tar" && if drush ard --destination=$file; then echo "drush ard complete"; else exit $?; fi && \
TOKEN="$(ssh -p `+"${LAGOON_CONFIG_TOKEN_PORT:-$TASK_SSH_PORT}"+` -t lagoon@`+"${LAGOON_CONFIG_TOKEN_HOST:-$TASK_SSH_HOST}"+` token)" && curl --fail-with-body -sS "`+"${LAGOON_CONFIG_API_HOST:-$TASK_API_HOST}"+`"/graphql \
-H "Authorization: Bearer $TOKEN" \
-F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"$TASK_DATA_ID"', "files": [null] } }' \
-F map='{ "0": ["variables.files.0"] }' \
-F 0=@$file && rm -rf $file;
`;

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: 'Drush archive-dump',
    taskName: generateTaskName(),
    environment: environmentId,
    service: 'cli',
    command,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: envPerm.id,
      type: AuditType.ENVIRONMENT,
      details: envPerm.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: "Drush Archive Dump task",
    },
  };
  userActivityLogger(`User triggered a Drush Archive Dump task on environment '${environmentId}'`, {
    project: '',
    event: 'api:taskDrushArchiveDump',
    payload: {
      environment: environmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushSqlDump: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushSqlDump:${envPerm.environmentType}`, {
    project: envPerm.project
  });
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );

  const command = String.raw`file="/tmp/$LAGOON_PROJECT-$LAGOON_GIT_SAFE_BRANCH-$(date --iso-8601=seconds).sql" && DRUSH_MAJOR_VERSION=$(drush status --fields=drush-version | awk '{ print $4 }' | grep -oE '^s*[0-9]+') && \
if [[ $DRUSH_MAJOR_VERSION -ge 9 ]]; then if drush sql-dump --extra-dump=--no-tablespaces --result-file=$file --gzip; then echo "drush sql-dump complete"; else exit $?; fi; else if drush sql-dump --extra=--no-tablespaces --result-file=$file --gzip; then echo "drush sql-dump complete"; else exit $?; fi; fi && \
TOKEN="$(ssh -p `+"${LAGOON_CONFIG_TOKEN_PORT:-$TASK_SSH_PORT}"+` -t lagoon@`+"${LAGOON_CONFIG_TOKEN_HOST:-$TASK_SSH_HOST}"+` token)" && curl --fail-with-body -sS "`+"${LAGOON_CONFIG_API_HOST:-$TASK_API_HOST}"+`"/graphql \
-H "Authorization: Bearer $TOKEN" \
-F operations='{ "query": "mutation ($task: Int!, $files: [Upload!]!) { uploadFilesForTask(input:{task:$task, files:$files}) { id files { filename } } }", "variables": { "task": '"$TASK_DATA_ID"', "files": [null] } }' \
-F map='{ "0": ["variables.files.0"] }' \
-F 0=@$file.gz && rm -rf $file.gz
`;

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: 'Drush sql-dump',
    taskName: generateTaskName(),
    environment: environmentId,
    service: 'cli',
    command,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: envPerm.id,
      type: AuditType.ENVIRONMENT,
      details: envPerm.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: "Drush SQL Dump task",
    },
  };
  userActivityLogger(`User triggered a Drush SQL Dump task on environment '${environmentId}'`, {
    project: '',
    event: 'api:taskDrushSqlDump',
    payload: {
      environment: environmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushCacheClear: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushCacheClear:${envPerm.environmentType}`, {
    project: envPerm.project
  });
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );

  const command =
    'drupal_version=$(drush status | grep -i "drupal version" | awk \'{print $NF}\') && \
  if [ ${drupal_version%.*} == "7" ]; then \
    if drush cc all; then echo "drush cc all complete"; else exit $?; fi; \
  elif [ ${drupal_version%.*.*} -ge "8" ] ; then \
    if drush cr -y; then echo "drush cache:rebuild complete"; else exit $?; fi; \
  else \
    echo "could not clear cache for found Drupal Version ${drupal_version}"; \
    exit 1; \
  fi';

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: 'Drush cache-clear',
    taskName: generateTaskName(),
    environment: environmentId,
    service: 'cli',
    command,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: envPerm.id,
      type: AuditType.ENVIRONMENT,
      details: envPerm.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: "Drush cache clear task",
    },
  };
  userActivityLogger(`User triggered a Drush cache clear task on environment '${environmentId}'`, {
    project: '',
    event: 'api:taskDrushCacheClear',
    payload: {
      environment: environmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushCron: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushCron:${envPerm.environmentType}`, {
    project: envPerm.project
  });
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: 'Drush cron',
    taskName: generateTaskName(),
    environment: environmentId,
    service: 'cli',
    command: `drush cron`,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: envPerm.id,
      type: AuditType.ENVIRONMENT,
      details: envPerm.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: "Drush cron task",
    },
  };
  userActivityLogger(`User triggered a Drush cron task on environment '${environmentId}'`, {
    project: '',
    event: 'api:taskDrushCron',
    payload: {
      environment: environmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushSqlSync: ResolverFn = async (
  root,
  {
    sourceEnvironment: sourceEnvironmentId,
    destinationEnvironment: destinationEnvironmentId
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(sourceEnvironmentId);
  await envValidators(sqlClientPool).environmentExists(
    destinationEnvironmentId
  );

  const sourceEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(sourceEnvironmentId);
  const destinationEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(destinationEnvironmentId);

  await hasPermission(
    'task',
    `drushSqlSync:source:${sourceEnvironment.environmentType}`,
    {
      project: sourceEnvironment.project
    }
  );
  await hasPermission(
    'task',
    `drushSqlSync:destination:${destinationEnvironment.environmentType}`,
    {
      project: destinationEnvironment.project
    }
  );
  await envValidators(sqlClientPool).environmentsHaveSameProject([
    sourceEnvironmentId,
    destinationEnvironmentId
  ]);
  await envValidators(sqlClientPool).environmentHasService(
    sourceEnvironmentId,
    'cli'
  );

  const command =
  `LAGOON_ALIAS_PREFIX="" && \
  if [[ ! "" = "$(drush | grep 'lagoon:aliases')" ]]; then LAGOON_ALIAS_PREFIX="lagoon.\${LAGOON_PROJECT}-"; fi && \
  drush -y sql-sync @\${LAGOON_ALIAS_PREFIX}${sourceEnvironment.name} @self`;

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: `Sync DB ${sourceEnvironment.name} -> ${destinationEnvironment.name}`,
    taskName: generateTaskName(),
    environment: destinationEnvironmentId,
    service: 'cli',
    command: command,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: sourceEnvironment.id,
      type: AuditType.ENVIRONMENT,
      details: sourceEnvironment.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: `Drush SQL sync task from '${sourceEnvironmentId}' to '${destinationEnvironmentId}'`,
    },
  };
  userActivityLogger(`User triggered a Drush SQL sync task from '${sourceEnvironmentId}' to '${destinationEnvironmentId}'`, {
    project: '',
    event: 'api:taskDrushSqlSync',
    payload: {
      sourceEnvironment: sourceEnvironmentId,
      destinationEnvironment: destinationEnvironmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushRsyncFiles: ResolverFn = async (
  root,
  {
    sourceEnvironment: sourceEnvironmentId,
    destinationEnvironment: destinationEnvironmentId
  },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(sourceEnvironmentId);
  await envValidators(sqlClientPool).environmentExists(
    destinationEnvironmentId
  );

  const sourceEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(sourceEnvironmentId);
  const destinationEnvironment = await environmentHelpers(
    sqlClientPool
  ).getEnvironmentById(destinationEnvironmentId);

  await hasPermission(
    'task',
    `drushRsync:source:${sourceEnvironment.environmentType}`,
    {
      project: sourceEnvironment.project
    }
  );
  await hasPermission(
    'task',
    `drushRsync:destination:${destinationEnvironment.environmentType}`,
    {
      project: destinationEnvironment.project
    }
  );
  await envValidators(sqlClientPool).environmentsHaveSameProject([
    sourceEnvironmentId,
    destinationEnvironmentId
  ]);
  await envValidators(sqlClientPool).environmentHasService(
    sourceEnvironmentId,
    'cli'
  );

  const command =
  `LAGOON_ALIAS_PREFIX="" && \
  if [[ ! "" = "$(drush | grep 'lagoon:aliases')" ]]; then LAGOON_ALIAS_PREFIX="lagoon.\${LAGOON_PROJECT}-"; fi && \
  drush -y rsync @\${LAGOON_ALIAS_PREFIX}${sourceEnvironment.name}:%files @self:%files -- --omit-dir-times --no-perms --no-group --no-owner --chmod=ugo=rwX`;

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: `Sync files ${sourceEnvironment.name} -> ${destinationEnvironment.name}`,
    taskName: generateTaskName(),
    environment: destinationEnvironmentId,
    service: 'cli',
    command: command,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: sourceEnvironment.id,
      type: AuditType.ENVIRONMENT,
      details: sourceEnvironment.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: `rsync sync task from '${sourceEnvironmentId}' to '${destinationEnvironmentId}'`,
    },
  };
  userActivityLogger(`User triggered an rsync sync task from '${sourceEnvironmentId}' to '${destinationEnvironmentId}'`, {
    project: '',
    event: 'api:taskDrushRsyncFiles',
    payload: {
      sourceEnvironment: sourceEnvironmentId,
      destinationEnvironment: destinationEnvironmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskDrushUserLogin: ResolverFn = async (
  root,
  { environment: environmentId },
  { sqlClientPool, hasPermission, userActivityLogger, keycloakGrant, legacyGrant, adminScopes }
) => {
  await envValidators(sqlClientPool).environmentExists(environmentId);
  const envPerm = await environmentHelpers(sqlClientPool).getEnvironmentById(
    environmentId
  );
  await hasPermission('task', `drushUserLogin:${envPerm.environmentType}`, {
    project: envPerm.project
  });
  await envValidators(sqlClientPool).environmentHasService(
    environmentId,
    'cli'
  );

  const sourceUser = await deploymentHelpers(sqlClientPool).getSourceUser(keycloakGrant, legacyGrant)
  const taskData = await Helpers(sqlClientPool, hasPermission, adminScopes).addTask({
    name: 'Drush uli',
    taskName: generateTaskName(),
    environment: environmentId,
    service: 'cli',
    command: `drush uli`,
    deployTokenInjection: false,
    projectKeyInjection: false,
    adminOnlyView: false,
    execute: true,
    sourceType: TaskSourceType.API,
    sourceUser: sourceUser,
  });

  const auditLog: AuditLog = {
    resource: {
      id: envPerm.id,
      type: AuditType.ENVIRONMENT,
      details: envPerm.name,
    },
    linkedResource: {
      id: taskData.id,
      type: AuditType.TASK,
      details: `Drush user login task`,
    },
  };
  userActivityLogger(`User triggered a Drush user login task on '${environmentId}'`, {
    project: '',
    event: 'api:taskDrushUserLogin',
    payload: {
      environment: environmentId,
      ...auditLog,
    }
  });

  return taskData;
};

export const taskSubscriber = createEnvironmentFilteredSubscriber([
  EVENTS.TASK
]);
