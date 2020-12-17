import * as R from 'ramda';
import { getOpenShiftInfoForProject, updateTask } from '@lagoon/commons/dist/api';
import { BaaS } from '@lagoon/commons/dist/openshiftApi';
import { logger } from "@lagoon/commons/dist/local-logging";
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { promisify } from 'util';

const ocsafety = string => string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const generateSanitizedNames = (project, environment, projectInfo, backup) => {
  try {
    const safeBranchName = ocsafety(environment.name);
    const safeProjectName = ocsafety(project.name);
    const namespace = projectInfo.openshiftProjectPattern
      ? projectInfo.openshiftProjectPattern
          .replace('${branch}', safeBranchName)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeBranchName}`;
    const restoreName = `restore-${R.slice(0, 7, backup.backupId)}`;
    return { namespace, safeProjectName, restoreName };
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

const restoreConfig = (name, backupId, safeProjectName, baasBucketName) => {
  let config = {
    apiVersion: 'backup.appuio.ch/v1alpha1',
    kind: 'Restore',
    metadata: {
      name
    },
    spec: {
      snapshot: backupId,
      restoreMethod: {
        s3: {},
      },
      backend: {
        s3: {
          bucket: baasBucketName ? baasBucketName : `baas-${safeProjectName}`
        },
        repoPasswordSecretRef: {
          key: 'repo-pw',
          name: 'baas-repo-pw'
        },
      },
    },
  };

  return config;
};

async function resticRestore (data: any) {
  const { backup, restore, project, environment } = data;
  const { project: projectInfo } = await getOpenShiftInfoForProject(project.name);
  const { url, token } = getUrlTokenFromProjectInfo(projectInfo, project.name);
  const { namespace, safeProjectName, restoreName } = generateSanitizedNames(project, environment, projectInfo, backup);

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const config = getConfig(url, token)
  const baas = new BaaS(config) as any;

  try {

    let baasBucketName = ""
    for (let variable of project.projectInfo.envVariables) {
      if (variable.name == "LAGOON_BAAS_BUCKET_NAME") {
        baasBucketName = variable.value
      }
    }
    // Parse out the baasBucketName for any migrated projects

    const config = {
      body: restoreConfig(restoreName, backup.backupId, safeProjectName, baasBucketName)
    };

    const restoreConfigPost = promisify(
      baas.ns(namespace).restores.post
    );
    await restoreConfigPost(config);

  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  logger.verbose(`${namespace}: Creating restore: ${backup.backupId}`);

  sendToLagoonLogs(
    'start',
    project.name,
    '',
    'task:misc-kubernetes:start',
    data,
    `*[${project.name}]* Restore \`${restore.id}\` *${backup.backupId}* started`
  );
}

export default resticRestore;
