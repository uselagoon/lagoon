// @flow

const promisify = require('util').promisify;
const OpenShiftClient = require('openshift-client');
const R = require('ramda');
const { logger } = require('@lagoon/commons/dist/local-logging');
const {
  getOpenShiftInfoForProject,
  updateTask
} = require('@lagoon/commons/dist/api');
const {
  sendToLagoonLogs,
  initSendToLagoonLogs
} = require('@lagoon/commons/dist/logs');
const {
  consumeTaskMonitor,
  initSendToLagoonTasks
} = require('@lagoon/commons/dist/tasks');

class JobNotCompletedYet extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobNotCompletedYet';
  }
}

initSendToLagoonLogs();
initSendToLagoonTasks();

const getJobStatus = jobInfo => {
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
      status: 'FAILED',
    });
  } catch (error) {
    logger.error(
      `Could not fail task ${taskId}. Message: ${error}`
    );
  }
}

const messageConsumer = async msg => {
  const { project, task, environment } = JSON.parse(msg.content.toString());

  logger.verbose(
    `Received JobOpenshift monitoring task for project: ${
      project.name
    }, task: ${task.id}`
  );

  const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id;
  const projectResult = await getOpenShiftInfoForProject(project.name);
  const projectOpenShift = projectResult.project;

  const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

  try {
    var safeBranchName = ocsafety(environment.name);
    var safeProjectName = ocsafety(project.name);
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(
      /\/$/,
      ''
    );
    var openshiftToken = projectOpenShift.openshift.token || '';
    var openshiftProject = projectOpenShift.openshiftProjectPattern
      ? projectOpenShift.openshiftProjectPattern
          .replace('${branch}', safeBranchName)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeBranchName}`;
    var jobName = `${openshiftProject}-${task.id}`;
  } catch (error) {
    logger.error(`Error while loading information for project ${project.name}`);
    logger.error(error);
    throw error;
  }

  // OpenShift API object
  const openshift = new OpenShiftClient.OApi({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetes = new OpenShiftClient.Core({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  const batchApi = new OpenShiftClient.Batch({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  let projectStatus = {};
  try {
    const projectsGet = promisify(openshift.projects(openshiftProject).get);
    projectStatus = await projectsGet();
  } catch (err) {
    if (err.code == 404) {
      logger.error(`Project ${openshiftProject} does not exist, bailing`);
      failTask(taskId);
      return;
    } else {
      logger.error(err);
      throw new Error();
    }
  }

  let jobInfo;
  try {
    const jobsGet = promisify(
      batchApi.namespaces(openshiftProject).jobs(jobName).get
    );
    jobInfo = await jobsGet();
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

  const jobsLogGet = async () => {
    // First fetch the pod(s) used to run this job
    const podsGet = promisify(kubernetes.ns(openshiftProject).pods.get);
    const pods = await podsGet({
      qs: {
        labelSelector: `job-name=${jobName}`
      }
    });
    const podNames = pods.items.map(pod => pod.metadata.name);

    // Combine all logs from all pod(s)
    let finalLog = '';
    for (const podName of podNames) {
      const podLogGet = promisify(
        kubernetes.ns(openshiftProject).pods(podName).log.get
      );
      const podLog = await podLogGet();

      finalLog =
        finalLog +
        `
========================================
Logs on pod ${podName}
========================================
${podLog}`;
    }

    return finalLog;
  };

  const deleteJob = async () => {
    try {
      const jobDelete = promisify(
        batchApi.namespaces(openshiftProject).jobs(jobName).delete
      );
      await jobDelete({
        body: {
          kind: 'DeleteOptions',
          apiVersion: 'v1',
          propagationPolicy: 'Foreground',
        },
      });
    } catch (err) {
      logger.error(`Couldn't delete job ${jobName}. Error: ${error}`);
    }
  };

  const jobStatus = getJobStatus(jobInfo);

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

  const meta = JSON.parse(msg.content.toString());
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
      await saveTaskLog(jobName, project.name, jobInfo, await jobsLogGet());
      await deleteJob();
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
      await saveTaskLog(jobName, project.name, jobInfo, await jobsLogGet());
      await deleteJob();
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
};

const saveTaskLog = async (jobName, projectName, jobInfo, log) => {
  const meta = {
    jobName,
    jobStatus: getJobStatus(jobInfo),
    remoteId: jobInfo.metadata.uid
  };

  sendToLagoonLogs(
    'info',
    projectName,
    '',
    `build-logs:job-openshift:${jobName}`,
    meta,
    log
  );
};

const deathHandler = async (msg, lastError) => {
  const { project, task } = JSON.parse(msg.content.toString());

  failTask(taskId);

  sendToLagoonLogs(
    'error',
    project.name,
    '',
    'task:job-openshift:error',
    {},
    `*[${project.name}]* Task \`${task.id}\` *${task.name}* ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

consumeTaskMonitor('job-openshift', messageConsumer, deathHandler);
