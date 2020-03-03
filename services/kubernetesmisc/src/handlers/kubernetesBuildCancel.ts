import * as R from 'ramda';
import { getOpenShiftInfoForProject, updateTask } from '@lagoon/commons/src/api';
import { logger } from "@lagoon/commons/src/local-logging";
import { sendToLagoonLogs } from '@lagoon/commons/src/logs';

import Api, { ClientConfiguration } from 'kubernetes-client';
const Client = Api.Client1_13;

const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const generateSanitizedNames = (project, environment, projectInfo) => {
  try {
    const safeBranchName = ocsafety(environment.name);
    const safeProjectName = ocsafety(project.name);
    const namespace = projectInfo.openshiftProjectPattern
      ? projectInfo.openshiftProjectPattern
          .replace('${branch}', safeBranchName)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeBranchName}`;
    return { namespace, safeProjectName };
  } catch (error) {
    logger.error(`Error while loading information for project ${project.name}`);
    logger.error(error);
    throw error;
  }
};

const getJobStatus = jobInfo => {
  if (R.isEmpty(jobInfo.body.status)) {
    return 'active';
  }

  if (R.propOr(false, 'active', jobInfo.body.status)) {
    return 'active';
  }

  if (R.propOr(false, 'failed', jobInfo.body.status)) {
    return 'failed';
  }

  if (R.propOr(false, 'succeeded', jobInfo.body.status)) {
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

const getJobInfo = async (client: Api.ApiRoot, namespace: string, jobName: string, taskId: string) => {
  try {
    return client.apis.batch.v1.namespaces(namespace).jobs(jobName).get()
  } catch (err) {
    if (err.code == 404) {
      return undefined;
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
    let completedDate = dateOrNull(jobInfo.body.status.completionTime);

    if (jobStatus === 'failed') {
      completedDate = dateOrNull(jobInfo.body.status.conditions[0].lastTransitionTime);
    }

    await updateTask(taskId, {
      status: jobStatus.toUpperCase(),
      created: convertDateFormat(jobInfo.body.metadata.creationTimestamp),
      started: dateOrNull(jobInfo.body.status.startTime),
      completed: completedDate
    });
  } catch (error) {
    logger.error(
      `Could not update task ${project.name} ${jobName}. Message: ${error}`
    );
  }
}

const deleteJob = async (client: Api.ApiRoot, namespace: string, jobName: string) => {
  try {
    const options = {
      body: {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground',
      }
    };
    // https://github.com/godaddy/kubernetes-client/blob/master/docs/1.13/Job.md#apisbatchv1namespacesnamespacejobsnamedelete
    return await client.apis.batch.v1.namespaces(namespace).jobs(jobName).delete(options)
  } catch (err) {
    logger.error(`Couldn't delete job ${jobName}. Error: ${err}`);
  }
};

const kubernetesBuildCancel = async (data: any) => {
  const { build: { name: buildName }, project, task, environment } = data;
  // const { project, task, environment } = JSON.parse(msg.content.toString());

  const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id;
  const { project: projectInfo } = await getOpenShiftInfoForProject(project.name);
  const { url, token } = getUrlTokenFromProjectInfo(projectInfo, project.name);
  const config: ClientConfiguration = getConfig(url, token);
  const client = new Client({ config });
  const { namespace, safeProjectName } = generateSanitizedNames(project, environment, projectInfo);

  // Check that job is still active
  const jobName = `${namespace}-${task.id}`;
  const jobInfo = await getJobInfo(client, namespace, jobName, taskId);
  if (!jobInfo) {
    logger.error(`Job ${jobName} does not exist, bailing`);
    failTask(taskId);
    return;
  }
  // const jobStatus = getJobStatus(jobInfo);
  
  await deleteJob(client, namespace, buildName);
  await updateLagoonTask(jobInfo, 'CANCELLED', taskId, project, jobName);

  logger.verbose(`${namespace}: Cancelling build: ${buildName}`);

  sendToLagoonLogs(
    'info',
    project.name,
    '',
    'task:misc-kubernetes:build:cancel',
    data,
    `*[${project.name}]* Cancelling build \`${buildName}\``
  );
}

export default kubernetesBuildCancel;