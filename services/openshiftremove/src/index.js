// @flow

const promisify = require('util').promisify;
const OpenShiftClient = require('openshift-client');
const { ServiceCatalog } = require('@lagoon/commons/dist/openshiftApi');
const { logger } = require('@lagoon/commons/dist/local-logging');
const {
  sendToLagoonLogs,
  initSendToLagoonLogs
} = require('@lagoon/commons/dist/logs');
const {
  consumeTasks,
  initSendToLagoonTasks
} = require('@lagoon/commons/dist/tasks');
const {
  getOpenShiftInfoForProject,
  deleteEnvironment
} = require('@lagoon/commons/dist/api');

initSendToLagoonLogs();
initSendToLagoonTasks();

const ocsafety = string =>
  string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

const pause = duration => new Promise(res => setTimeout(res, duration));

const retry = (retries, fn, delay = 1000) =>
  fn().catch(
    err =>
      retries > 1
        ? pause(delay).then(() => retry(retries - 1, fn, delay))
        : Promise.reject(err)
  );

const messageConsumer = async function(msg) {
  const { projectName, branch, pullrequestNumber, type } = JSON.parse(
    msg.content.toString()
  );

  logger.verbose(
    `Received RemoveOpenshift task for project ${projectName}, type ${type}, branch ${branch}, pullrequest ${pullrequestNumber}`
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
    `Will remove OpenShift Project ${openshiftProject} on ${openshiftConsole}`
  );

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

  const serviceCatalog = new ServiceCatalog({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  const serviceInstancesGet = promisify(
    serviceCatalog.ns(openshiftProject).serviceinstances.get
  );

  const serviceInstanceDelete = async name => {
    const deleteFn = promisify(
      serviceCatalog.ns(openshiftProject).serviceinstances(name).delete
    );

    return deleteFn({
      body: {
        kind: 'DeleteOptions',
        apiVersion: 'servicecatalog.k8s.io/v1beta1'
      }
    });
  };

  const serviceBindingsGet = promisify(
    serviceCatalog.ns(openshiftProject).servicebindings.get
  );

  const serviceBindingDelete = async name => {
    const deleteFn = promisify(serviceCatalog.ns(openshiftProject).servicebindings(name).delete);

    return deleteFn({
      body: {
        kind: 'DeleteOptions',
        apiVersion: 'servicecatalog.k8s.io/v1beta1'
      }
    });
  };


  const hasZeroServiceBindings = () =>
    new Promise(async (resolve, reject) => {
      const serviceBindings = await serviceBindingsGet();
      if (serviceBindings.items.length === 0) {
        logger.info(`${openshiftProject}: All ServiceBindings deleted`);
        resolve();
      } else {
        logger.info(
          `${openshiftProject}: ServiceBindings not deleted yet, will try again in 2sec`
        );
        reject();
      }
    });

  const hasZeroServiceInstances = () =>
    new Promise(async (resolve, reject) => {
      const serviceInstances = await serviceInstancesGet();
      if (serviceInstances.items.length === 0) {
        logger.info(`${openshiftProject}: All ServiceInstances deleted`);
        resolve();
      } else {
        logger.info(
          `${openshiftProject}: ServiceInstances not deleted yet, will try again in 10sec`
        );
        reject();
      }
    });

  const meta = {
    projectName: projectName,
    openshiftProject: openshiftProject
  };

  // Check if project exists
  try {
    const projectsGet = promisify(openshift.projects(openshiftProject).get);
    await projectsGet();
  } catch (err) {
    // a non existing project also throws an error, we check if it's a 404, means it does not exist, and we assume it's already removed
    if (err.code == 404) {
      logger.info(
        `${openshiftProject} does not exist, assuming it was removed`
      );
      sendToLagoonLogs(
        'success',
        projectName,
        '',
        'task:remove-openshift:finished',
        meta,
        `*[${projectName}]* remove \`${openshiftProject}\``
      );
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
      return; // we are done here
    } else {
      logger.error(err);
      throw new Error();
    }
  }

  // Project exists, let's remove it
  try {
    const serviceBindings = await serviceBindingsGet();
    for (let serviceBinding of serviceBindings.items) {
      await serviceBindingDelete(serviceBinding.metadata.name);

      logger.info(
        `${openshiftProject}: Deleting ServiceBinding ${
          serviceBinding.metadata.name
        }`
      );
    }

    // ServiceBindings are deleted quickly, but we still have to wait before
    // we attempt to delete the ServiceInstance.
    try {
      await retry(10, hasZeroServiceBindings, 2000);
    } catch (err) {
      throw new Error(
        `${openshiftProject}: ServiceBindings not deleted`
      );
    }

    const serviceInstances = await serviceInstancesGet();
    for (let serviceInstance of serviceInstances.items) {
      await serviceInstanceDelete(serviceInstance.metadata.name);

      logger.info(
        `${openshiftProject}: Deleting ServiceInstance ${
          serviceInstance.metadata.name
        }`
      );
    }

    // Confirm all ServiceInstances are deleted.
    try {
      await Promise.all([
        retry(12, hasZeroServiceInstances, 10000)
      ]);
    } catch (err) {
      throw new Error(
        `${openshiftProject}: ServiceInstances not deleted`
      );
    }

    const projectsDelete = promisify(
      openshift.projects(openshiftProject).delete
    );
    await projectsDelete({
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
      'task:remove-openshift:finished',
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
    'task:remove-openshift:error',
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

consumeTasks('remove-openshift', messageConsumer, retryHandler, deathHandler);
