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
        activeEnvironment: safeActiveProductionEnvironment,
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
    const migrateRoutesDelete = promisify(
      dioscuri.ns(openshiftProject).routemigrates(openshiftProject).delete
    );
    await migrateRoutesDelete({
      body: {}
    });
    await new Promise(resolve => setTimeout(resolve, 10000)); // sleep a bit after deleting
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
    await new Promise(resolve => setTimeout(resolve, 1000)); // sleep a bit before creating
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

  // check the route migrate resource for the status conditions, only update lagoon on a completed task
  var whileCount = 0;
  var breakLoop = false;
  while (whileCount < 10 && !breakLoop) {
    try {
      const migrateRoutesGet = promisify(
          dioscuri.ns(openshiftProject).routemigrates(openshiftProject).get
      );
      routeMigrateStatus = await migrateRoutesGet();
      try {
        for (i = 0; i < routeMigrateStatus.status.conditions.length; i++) {
          logger.verbose(`${openshiftProject}: active/standby switch status: ${routeMigrateStatus.status.conditions[i].type}`);
          switch (routeMigrateStatus.status.conditions[i].type ) {
            case 'started':
              break;
            case 'failed':
              // @TODO do something here maybe, or possibly a new api query on the status of the migration?
              return breakLoop = true;
            case 'completed':
              // swap the active/standby in lagoon by updating the project
              try {
                const response = await updateProject(projectOpenShift.id, {
                  activeProductionEnvironment: safeStandbyProductionEnvironment,
                  standbyProductionEnvironment: safeActiveProductionEnvironment,
                  activeRoutes: routeMigrateStatus.spec.routes.activeRoutes,
                  standbyRoutes: routeMigrateStatus.spec.routes.standbyRoutes,
                });
              } catch (err) {
                  logger.error(err);
                  throw new Error();
              }
              logger.verbose(`${openshiftProject}: active/standby switch updated in lagoon`);
              return breakLoop = true;
          }
        }
      } catch (err) {
        logger.verbose(`${openshiftProject}: active/standby switch waiting still`);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait for a bit between getting the resource
    } catch (err) {
        logger.error(err);
        throw new Error();
    }
  }



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
