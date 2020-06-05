const promisify = require('util').promisify;
import R from 'ramda';
import KubernetesClient from 'kubernetes-client';
import { logger } from '@lagoon/commons/dist/local-logging';
import {
  sendToLagoonLogs,
  initSendToLagoonLogs
} from '@lagoon/commons/dist/logs';
import {
  consumeTasks,
  initSendToLagoonTasks
} from '@lagoon/commons/dist/tasks';
import {
  getOpenShiftInfoForProject,
  deleteEnvironment
} from '@lagoon/commons/dist/api';

initSendToLagoonLogs();
initSendToLagoonTasks();

const ocsafety = string =>
  string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const messageConsumer = async function(msg) {
  const { projectName, branch, pullrequestNumber, type } = JSON.parse(
    msg.content.toString()
  );

  logger.verbose(
    `Received RemoveKubernetes task for project ${projectName}, type ${type}, branch ${branch}, pullrequest ${pullrequestNumber}`
  );

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project;

  try {
    var safeProjectName = ocsafety(projectName);
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(
      /\/$/,
      ''
    );
    var openshiftToken = projectOpenShift.openshift.token || '';

    var openshiftProject;
    var environmentName;

    switch (type) {
      case 'pullrequest':
        environmentName = `pr-${pullrequestNumber}`;
        openshiftProject = `${safeProjectName}-pr-${pullrequestNumber}`;
        break;

      case 'branch':
        const safeBranchName = ocsafety(branch);
        environmentName = branch;
        openshiftProject = `${safeProjectName}-${safeBranchName}`;
        break;

      case 'promote':
        environmentName = branch;
        openshiftProject = `${projectName}-${branch}`;
        break;
    }
  } catch (error) {
    logger.warn(
      `Error while loading openshift information for project ${projectName}, error ${error}`
    );
    throw error;
  }

  logger.info(
    `Will remove Kubernetes Namespace ${openshiftProject} on ${openshiftConsole}`
  );

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const kubernetes = new KubernetesClient.Core({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  const meta = {
    projectName: projectName,
    openshiftProject: openshiftProject
  };

  // Check if project exists
  try {
    const namespacesSearch = promisify(kubernetes.namespaces.get);
    const namespacesResult = await namespacesSearch({
      qs: {
        fieldSelector: `metadata.name=${openshiftProject}`
      }
    });
    const namespaces = R.propOr([], 'items', namespacesResult);

    // An empty list means the namespace does not exist and we assume it's already removed
    if (R.isEmpty(namespaces)) {
      logger.info(
        `${openshiftProject} does not exist, assuming it was removed`
      );
      sendToLagoonLogs(
        'success',
        projectName,
        '',
        'task:remove-kubernetes:finished',
        meta,
        `*[${projectName}]* remove \`${openshiftProject}\``
      );

      // Update GraphQL API that the Environment has been deleted
      await deleteEnvironment(environmentName, projectName, false);
      logger.info(
        `${openshiftProject}: Deleted Environment '${environmentName}' in API`
      );

      return; // we are done here
    }
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  // Project exists, let's remove it
  try {
    /**
     * TODO: When lagoon-k8s gets it's own operator or uses ServiceCatalog, remove
     * any of those project dependencies first (see service catalog examples
     * in openshiftremove).
     */

    const namespaceDelete = promisify(
      kubernetes.namespaces(openshiftProject).delete
    );
    await namespaceDelete({
      body: {
        kind: 'DeleteOptions',
        apiVersion: 'v1',
        propagationPolicy: 'Foreground'
      }
    });
    logger.info(`${openshiftProject}: Project deleted`);
    sendToLagoonLogs(
      'success',
      projectName,
      '',
      'task:remove-kubernetes:finished',
      meta,
      `*[${projectName}]* remove \`${openshiftProject}\``
    );
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  // Update GraphQL API that the Environment has been deleted
  try {
    await deleteEnvironment(environmentName, projectName, false);
    logger.info(
      `${openshiftProject}: Deleted Environment '${environmentName}' in API`
    );
  } catch (err) {
    logger.error(err);
    throw new Error();
  }
};

const deathHandler = async (msg, lastError) => {
  const { projectName, branch, pullrequestNumber, type } = JSON.parse(
    msg.content.toString()
  );

  const openshiftProject = ocsafety(
    `${projectName}-${branch || pullrequestNumber}`
  );

  sendToLagoonLogs(
    'error',
    projectName,
    '',
    'task:remove-kubernetes:error',
    {},
    `*[${projectName}]* remove \`${openshiftProject}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  return;
};

consumeTasks('remove-kubernetes', messageConsumer, retryHandler, deathHandler);
