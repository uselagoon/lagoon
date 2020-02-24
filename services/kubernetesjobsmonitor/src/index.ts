import * as R from 'ramda';
import Api, { ClientConfiguration } from 'kubernetes-client';
const Client = Api.Client1_13;

const { logger } = require('@lagoon/commons/src/local-logging');
const { getOpenShiftInfoForProject, updateTask } = require('@lagoon/commons/src/api');
const { sendToLagoonLogs, initSendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { consumeTasks, initSendToLagoonTasks, createTaskMonitor } = require('@lagoon/commons/src/tasks');

class JobNotCompletedYet extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobNotCompletedYet';
  }
}

initSendToLagoonLogs();
initSendToLagoonTasks();

const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const getNamespaceName = (project, environment, projectInfo) => {
  try {
    const safeBranchName = ocsafety(environment.name);
    const safeProjectName = ocsafety(project.name);
    const namespace = projectInfo.openshiftProjectPattern
      ? projectInfo.openshiftProjectPattern
          .replace('${branch}', safeBranchName)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeBranchName}`;
    return { namespace };
  } catch (error) {
    logger.error(`Error while loading information for project ${project.name}`);
    logger.error(error);
    throw error;
  }
};

const getJobStatus = jobInfo => {
  console.log(jobInfo);
  if (R.isEmpty(jobInfo.status)) {
    return 'active';
  }

  if (R.propOr(false, 'active', jobInfo.status)) {
    return 'active';
  }

  if (R.propOr(false, 'failed', jobInfo.status)) {
    return 'failed';
  }

  if (R.propOr(false, 'succeeded', jobInfo.status)) {
    return 'succeeded';
  }

  return 'unknown';
};

const failTask = async taskId => {
  try {
    await updateTask(taskId, {
      status: 'FAILED'
    });
  } catch (error) {
    logger.error(`Could not fail task ${taskId}. Message: ${error}`);
  }
};

const getUrlTokenFromProjectInfo = (projectOpenShift, name) => {
  try {
    const url = projectOpenShift.openshift.consoleUrl.replace(/\/$/, '');
    const token = projectOpenShift.openshift.token || '';
    return { url, token };
  } catch (error) {
    logger.warn(
      `Error while loading information for project ${name}: ${error}`
    );
    throw error;
  }
};

const getConfig = (url, token) => ({
  url,
  insecureSkipTlsVerify: true,
  auth: {
    bearer: token
  }
});

const projectExists = async (client: Api.ApiRoot, namespace: string) => {
  const namespaces = await client.api.v1.namespaces(namespace).get();
  if (
    namespaces.statusCode !== 200 &&
    namespaces.body.metadata.name !== namespace
  ) {
    return false;
  }

  return true;
};

const jobsLogGet = async (client: Api.ApiRoot, namespace: string, jobName: string) => {
  const pods = client.api.v1.namespaces(namespace).pods.get({ 
    qs: { labelSelector: `job-name=${jobName}` } 
  });
  const podNames = pods.items.map(pod => pod.metadata.name);

  // Combine all logs from all pod(s)
  let finalLog = '';
  for (const podName of podNames) {
    const podLog = client.api.v1.namespaces(namespace).pods(podName).log.get();

    finalLog =
      finalLog +
      `
========================================
Logs on pod ${podName}
========================================
${podLog}`;
    }

    return finalLog;
}

const deleteJob = async (client: Api.ApiRoot, namespace: string, jobName: string) => {
  try {
    // const jobDelete = promisify(
    //   batchApi.namespaces(openshiftProject).jobs(jobName).delete
    // );
    const jobDelete = await client.apis.batch.v1.namespaces(namespace).jobs(jobName).get()
    await jobDelete({
      body: {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      },
    });
  } catch (err) {
    logger.error(`Couldn't delete job ${jobName}. Error: ${err}`);
  }
};

const getJobInfo = async (client: Api.ApiRoot, namespace: string, jobName: string, taskId: string) => {
  try {
    return client.apis.batch.v1.namespaces(namespace).jobs(jobName).get()
  } catch (err) {
    if (err.code == 404) {
      logger.error(`Job ${jobName} does not exist, bailing`);
      failTask(taskId);
      return;
    } else {
      logger.error(err);
      throw new Error();
    }
  }
}

const updateLagoonTask = async (jobInfo, jobStatus, taskId, project, jobName) => {
  // Update lagoon task
  try {
    const convertDateFormat = R.init;
    const dateOrNull = R.unless(R.isNil, convertDateFormat);
    let completedDate = dateOrNull(jobInfo.status.completionTime);

    if (jobStatus === 'failed') {
      completedDate = dateOrNull(jobInfo.status.conditions[0].lastTransitionTime);
    }

    await updateTask(taskId, {
      status: jobStatus.toUpperCase(),
      created: convertDateFormat(jobInfo.metadata.creationTimestamp),
      started: dateOrNull(jobInfo.status.startTime),
      completed: completedDate
    });
  } catch (error) {
    logger.error(
      `Could not update task ${project.name} ${jobName}. Message: ${error}`
    );
  }
}

const saveAndLog = async (client, jobStatus, project, task, namespace, jobName, jobInfo, meta) => {
  switch (jobStatus) {
    case 'active':
      sendToLagoonLogs(
        'info',
        project.name,
        '',
        `task:job-openshift:${jobStatus}`,
        meta,
        `*[${project.name}]* Task \`${task.id}\` *${task.name}* active`
      );
      throw new JobNotCompletedYet(
        `*[${project.name}]* Task \`${task.id}\` *${task.name}* active`
      );

    case 'failed':
      await saveTaskLog(jobName, project.name, jobInfo, await jobsLogGet(client, namespace, jobName));
      await deleteJob(client, name, jobName);
      sendToLagoonLogs(
        'error',
        project.name,
        '',
        `task:job-openshift:${jobStatus}`,
        meta,
        `*[${project.name}]* Task \`${task.id}\` *${task.name}* failed.`
      );
      break;

    case 'succeeded':
      await saveTaskLog(jobName, project.name, jobInfo, await jobsLogGet(client, namespace, jobName));
      await deleteJob(client, namespace, jobName);
      sendToLagoonLogs(
        'info',
        project.name,
        '',
        `task:job-openshift:${jobStatus}`,
        meta,
        `*[${project.name}]* Task \`${task.id}\` *${task.name}* succeeded.`
      );
      break;

    default:
      sendToLagoonLogs(
        'info',
        project.name,
        '',
        `task:job-openshift:${jobStatus}`,
        meta,
        `*[${project.name}]* Task \`${task.id}\` *${
          task.name
        }* phase ${jobStatus}`
      );
      throw new JobNotCompletedYet(
        `*[${project.name}]* Task \`${task.id}\` *${
          task.name
        }* phase ${jobStatus}`
      );
  }
}

const messageConsumer = async msg => {
  const { project, task, environment } = JSON.parse(msg.content.toString());

  logger.verbose(`Received JobKubernetes monitoring task for project: ${project.name}, task: ${task.id}`);

  const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id;
  const { project: projectInfo } = await getOpenShiftInfoForProject(project.name);

  const { url, token } = getUrlTokenFromProjectInfo(projectInfo, project.name);
  const config: ClientConfiguration = getConfig(url, token);
  const client = new Client({ config });

  const { namespace } = getNamespaceName(project, environment, projectInfo);
  if (!(await projectExists(client, namespace))) {
    logger.error(`Project ${namespace} does not exist, bailing`);
    return;
  }

  const jobName = `${namespace}-${task.id}`;
  const jobInfo = getJobInfo(client, namespace, jobName, taskId);
  const jobStatus = getJobStatus(jobInfo);

  await updateLagoonTask(jobInfo, jobStatus, taskId, project, jobName);
  const meta = JSON.parse(msg.content.toString());

  saveAndLog(client, jobStatus, project, task, namespace, jobName, jobInfo, meta);
};

const saveTaskLog = async (jobName, projectName, jobInfo, log) => {
  const meta = {
    jobName,
    jobStatus: getJobStatus(jobInfo),
    remoteId: jobInfo.body.metadata.uid
  };

  sendToLagoonLogs(
    'info',
    projectName,
    '',
    `build-logs:job-kubernetes:${jobName}`,
    meta,
    log
  );
};

const deathHandler = async (msg, lastError) => {
  const { project, task } = JSON.parse(msg.content.toString());

  const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id;
  failTask(taskId);

  sendToLagoonLogs(
    'error',
    project.name,
    '',
    'task:job-kubernetes:error',
    {},
    `*[${project.name}]* Task \`${task.id}\` *${task.name}* ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

consumeTasks('job-kubernetes', messageConsumer, deathHandler);
