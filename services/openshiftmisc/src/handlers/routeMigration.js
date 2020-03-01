// @flow

const promisify = require('util').promisify;
const OpenShiftClient = require('openshift-client');
const R = require('ramda');
const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const {
  getOpenShiftInfoForProject,
} = require('@lagoon/commons/src/api');
const { RouteMigration } = require('@lagoon/commons/src/openshiftApi');


async function routeMigration (data: Object) {
  const { projectName, sourceBranchName, destinationBranchName } = data;

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project;

  const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

  try {
    var safeBranchName = ocsafety(sourceBranchName);
    var safeDestinationBranchName = ocsafety(destinationBranchName);
    var safeProjectName = ocsafety(projectName);
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
    // create the destination openshift project name
    var destinationOpenshiftProject = projectOpenShift.openshiftProjectPattern
      ? projectOpenShift.openshiftProjectPattern
          .replace('${branch}', safeDestinationBranchName)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeDestinationBranchName}`;
  } catch (error) {
    logger.error(`Error while loading information for project ${projectName}`);
    logger.error(error);
    throw error;
  }

  // define the routemigration
  const migrateRoutes = (openshiftProject, destinationOpenshiftProject) => {
    let config = {
      apiVersion: 'dioscuri.amazee.io/v1',
      kind: 'RouteMigrate',
      metadata: {
        name: openshiftProject,
        annotations: {
            'dioscuri.amazee.io/migrate':'true'
        }
      },
      spec: {
        destinationNamespace: destinationOpenshiftProject,
      },
    };

    return config;
  };

  // Kubernetes API Object - needed as some API calls are done to the Kubernetes API part of OpenShift and
  // the OpenShift API does not support them.
  const dioscuri = new RouteMigration({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });


  // @TODO: check if the routemigrate resource already exists and we just patch the annotation and destination instead
  try {
    const migrateRoutesPost = promisify(
        dioscuri.ns(openshiftProject).routemigrates.post
    );
    await migrateRoutesPost({
      body: migrateRoutes(openshiftProject, destinationOpenshiftProject)
    });
    logger.verbose(`${openshiftProject}: created routeMigration`);
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  logger.verbose(`${openshiftProject}: Creating routeMigration: ${destinationOpenshiftProject}`);

  sendToLagoonLogs(
    'start',
    projectName,
    '',
    'task:misc-openshift:route:migrate',
    data,
    `*[${projectName}]* Route Migration between environments *${destinationOpenshiftProject}* started`
  );
}

module.exports = routeMigration;
