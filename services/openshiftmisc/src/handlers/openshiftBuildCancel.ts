import { promisify } from 'util';
import OpenShiftClient from 'openshift-client';
import R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { getOpenShiftInfoForProject } from '@lagoon/commons/dist/api';

export async function openshiftBuildCancel(data) {
  const { build, project, environment } = data;

  const result = await getOpenShiftInfoForProject(project.name);
  const projectOpenShift = result.project;

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
    var buildName = build.name;
  } catch (error) {
    logger.error(`Error while loading information for project ${project.name}`);
    logger.error(error);
    throw error;
  }

  const openshift = new OpenShiftClient.OApi({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  openshift.ns.addResource('builds');

  try {
    const cancelBuildPatch = promisify(
      openshift.ns(openshiftProject).builds(buildName).patch
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

  logger.verbose(`${openshiftProject}: Cancelling build: ${buildName}`);

  sendToLagoonLogs(
    'info',
    project.name,
    '',
    'task:misc-openshift:build:cancel',
    data,
    `*[${project.name}]* Cancelling build \`${buildName}\``
  );
}
