import * as R from 'ramda';
import { getOpenShiftInfoForProject, updateTask, updateDeployment } from '@lagoon/commons/dist/api';
import { logger } from "@lagoon/commons/dist/local-logging";
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';

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

const getJobInfo = async (client: Api.ApiRoot, namespace: string, jobName: string) => {
  let result;
  try {
    result = await client.apis.batch.v1.namespaces(namespace).jobs(jobName).get()
  } catch (err) {
    if (err.code == 404) {
      return undefined;
    } else {
      logger.error(err);
      throw new Error();
    }
  }
  return result;
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
  const { build: { name: buildName, id }, project, environment } = data;

  const { project: projectInfo } = await getOpenShiftInfoForProject(project.name);
  const { url, token } = getUrlTokenFromProjectInfo(projectInfo, project.name);
  const config: ClientConfiguration = getConfig(url, token);
  const client = new Client({ config });
  const { namespace } = generateSanitizedNames(project, environment, projectInfo);

  // Check that job is still active
  // Checking that the job exists at all is the same as checking if it's active
  const jobInfo = await getJobInfo(client, namespace, buildName);
  if (jobInfo) {
    logger.error(`Job ${buildName} does not exist, bailing`);
    await deleteJob(client, namespace, buildName);
    // Update lagoon deployment to CANCELLED.
    await updateDeployment(parseInt(id, 10), { status: 'CANCELLED' })
  }


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
