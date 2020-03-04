// @flow

const promisify = require('util').promisify;
const OpenShiftClient = require('openshift-client');
const R = require('ramda');
const { logger } = require('@lagoon/commons/src/local-logging');
const { sendToLagoonLogs } = require('@lagoon/commons/src/logs');
const {
  getOpenShiftInfoForProject,
  updateProject,
} = require('@lagoon/commons/src/api');
const { RouteMigration } = require('@lagoon/commons/src/openshiftApi');

async function routeMigration (data: Object) {
  const { projectName, activeProductionEnvironment, standbyProductionEnvironment } = data;

  const result = await getOpenShiftInfoForProject(projectName);
  const projectOpenShift = result.project;

  const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

  try {
    var safeActiveProductionEnvironment = ocsafety(activeProductionEnvironment);
    var safeStandbyProductionEnvironment = ocsafety(standbyProductionEnvironment);
    var safeProjectName = ocsafety(projectName);
    var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(
      /\/$/,
      ''
    );
    var openshiftToken = projectOpenShift.openshift.token || '';
    var openshiftProject = projectOpenShift.openshiftProjectPattern
      ? projectOpenShift.openshiftProjectPattern
          .replace('${branch}', safeActiveProductionEnvironment)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeActiveProductionEnvironment}`;
    // create the destination openshift project name
    var destinationOpenshiftProject = projectOpenShift.openshiftProjectPattern
      ? projectOpenShift.openshiftProjectPattern
          .replace('${branch}', safeStandbyProductionEnvironment)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeStandbyProductionEnvironment}`;
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


  // @TODO: this seems a bit silly, might be a better way to do it. but `.patch` on the routemigrates resource fails with,
  // research says this is because crd is not supported to be patched
  // `message=the body of the request was in an unknown format - accepted media types include: application/json-patch+json`
  try {
    const cancelBuildPatch = promisify(
      dioscuri.ns(openshiftProject).routemigrates(openshiftProject).delete
    );
    await cancelBuildPatch({
      body: {}
    });
    await sleep(2000); // sleep a bit after deleting
    try {
      const migrateRoutesPost = promisify(
          dioscuri.ns(openshiftProject).routemigrates.post
      );
      await migrateRoutesPost({
        body: migrateRoutes(openshiftProject, destinationOpenshiftProject)
      });
      logger.verbose(`${openshiftProject}: created routeMigration resource`);
    } catch (err) {
        logger.error(err);
        throw new Error();
    }
  } catch (err) {
    try {
      const migrateRoutesPost = promisify(
          dioscuri.ns(openshiftProject).routemigrates.post
      );
      await migrateRoutesPost({
        body: migrateRoutes(openshiftProject, destinationOpenshiftProject)
      });
      logger.verbose(`${openshiftProject}: created routeMigration resource`);
    } catch (err) {
        logger.error(err);
        throw new Error();
    }
  }

  // swap the active/standby in lagoon by updating the project
  try {
    const response = await updateProject(projectOpenShift.id, {
      activeProductionEnvironment: projectOpenShift.standbyProductionEnvironment,
      standbyProductionEnvironment: projectOpenShift.activeProductionEnvironment,
    });
  } catch (err) {
      logger.error(err);
      throw new Error();
  }
  logger.verbose(`${openshiftProject}: Active/Standby switch updated in lagoon`);

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
