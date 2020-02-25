import * as R from 'ramda';
import { getOpenShiftInfoForProject, updateTask } from '@lagoon/commons/src/api';
import { logger } from "@lagoon/commons/src/local-logging";
import { sendToLagoonLogs } from '@lagoon/commons/src/logs';
import { promisify } from 'util';

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

const kubernetesBuildCancel = async (data: any) => {
  const { build: { name: buildName }, project, environment } = data;

  const { project: projectInfo } = await getOpenShiftInfoForProject(project.name);
  const { url, token } = getUrlTokenFromProjectInfo(projectInfo, project.name);
  const config: ClientConfiguration = getConfig(url, token);
  const client = new Client({ config });
  const { namespace, safeProjectName } = generateSanitizedNames(project, environment, projectInfo);
  // try {
  //   var safeBranchName = ocsafety(environment.name);
  //   var safeProjectName = ocsafety(project.name);
  //   var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(
  //     /\/$/,
  //     ''
  //   );
  //   var openshiftToken = projectOpenShift.openshift.token || '';
  //   var openshiftProject = projectOpenShift.openshiftProjectPattern
  //     ? projectOpenShift.openshiftProjectPattern
  //         .replace('${branch}', safeBranchName)
  //         .replace('${project}', safeProjectName)
  //     : `${safeProjectName}-${safeBranchName}`;
  //   var buildName = build.name;
  // } catch (error) {
  //   logger.error(`Error while loading information for project ${project.name}`);
  //   logger.error(error);
  //   throw error;
  // }

  const openshift = new OpenShiftClient.OApi({
    url,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: token
    }
  });

  openshift.ns.addResource('builds');

  try {
    const cancelBuildPatch = promisify(
      openshift.ns(namespace).builds(buildName).patch
    );
    await cancelBuildPatch({
      body: {
        status: {
          cancelled: true
        }
      }
    });
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  logger.verbose(`${namespace}: Cancelling build: ${buildName}`);

  sendToLagoonLogs(
    'info',
    project.name,
    '',
    'task:misc-openshift:build:cancel',
    data,
    `*[${project.name}]* Cancelling build \`${buildName}\``
  );
}

export default kubernetesBuildCancel;