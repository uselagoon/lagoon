import { promisify } from 'util';
import OpenShiftClient from 'openshift-client';
import R from 'ramda';
import { logger } from '@lagoon/commons/dist/local-logging';
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import {
  getOpenShiftInfoForProject,
  updateProject,
  updateTask,
} from '@lagoon/commons/dist/api';
import { RouteMigration } from '@lagoon/commons/dist/openshiftApi';
const convertDateFormat = R.init;

const pause = duration => new Promise(res => setTimeout(res, duration));
const retry = (retries, fn, delay = 1000) =>
  fn().catch(
    err =>
      retries > 1
        ? pause(delay).then(() => retry(retries - 1, fn, delay))
        : Promise.reject(err)
  );

export async function routeMigration (data) {
  const { project, productionEnvironment, standbyProductionEnvironment, task } = data;

  const result = await getOpenShiftInfoForProject(project.name);
  const projectOpenShift = result.project;
  const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

  try {
    var safeActiveProductionEnvironment = ocsafety(project.productionEnvironment);
    var safeStandbyProductionEnvironment = ocsafety(project.standbyProductionEnvironment);
    var safeProjectName = ocsafety(project.name);
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
    logger.error(`Error while loading information for project ${project.name}`);
    logger.error(error);
    throw error;
  }

  // define the routemigration. the annotation being set to true is what actually triggers the switch
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
  const dioscuri: any = new RouteMigration({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });
  const openshift = new OpenShiftClient.OApi({
    url: openshiftConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: openshiftToken
    }
  });

  const routeMigratesGet = promisify(
    dioscuri.ns(openshiftProject).routemigrates.get
  );

  const routeMigrateDelete = async name => {
    const deleteFn = promisify(dioscuri.ns(openshiftProject).routemigrates(openshiftProject).delete);
    return deleteFn({
      body: {}
    });
  };

  const hasNoRouteMigrate = () =>
    new Promise(async (resolve, reject) => {
      const routeMigrates = await routeMigratesGet();
      if (routeMigrates.items.length === 0) {
        logger.info(`${openshiftProject}: RouteMigrate deleted`);
        resolve();
      } else {
        logger.info(
          `${openshiftProject}: RouteMigrate not deleted yet, will try again in 2sec`
        );
        reject();
      }
    });

  // check that the namespaces exist for source and destination before we try and move any routes
  try {
    // check source
    const projectSourceGet = promisify(openshift.projects(openshiftProject).get)
    await projectSourceGet()
    logger.info(`${openshiftProject}: Project ${openshiftProject} already exists, continuing`)
    // check dest
    const projectDestGet = promisify(openshift.projects(destinationOpenshiftProject).get)
    await projectDestGet()
    logger.info(`${openshiftProject}: Project ${destinationOpenshiftProject} already exists, continuing`)
  } catch (err) {
    // throw error if the namespace doesn't exist
    logger.error(err)
    throw new Error
  }

  // check if there is already a route migrate resource, delete it if there is
  try {
    const routeMigrates = await routeMigratesGet();
    for (let routeMigrate of routeMigrates.items) {
      await routeMigrateDelete(routeMigrate.metadata.name);
      logger.info(
        `${openshiftProject}: Deleting RouteMigrate ${routeMigrate.metadata.name}`
      );
    }
    // RouteMigrates are deleted quickly, but we still have to wait before we attempt to create the new one
    try {
      await retry(30, hasNoRouteMigrate, 2000);
    } catch (err) {
      throw new Error(
        `${openshiftProject}: RouteMigrate not deleted`
      );
    }
  } catch (err) {
      logger.info(`${openshiftProject}: RouteMigrate doesn't exist`); // proceed if it doesn't exist
  }

  // add the routemigrate resource
  try {
    const routeMigratePost = promisify(
        dioscuri.ns(openshiftProject).routemigrates.post
    );
    await routeMigratePost({
      body: migrateRoutes(openshiftProject, destinationOpenshiftProject)
    });
    logger.verbose(`${openshiftProject}: RouteMigrate resource created`);
  } catch (err) {
      logger.error(err);
      throw new Error();
  }

  sendToLagoonLogs(
    'info',
    project.name,
    '',
    'task:misc-openshift:route:migrate',
    data,
    `*[${project.name}]* Route Migration between environments *${destinationOpenshiftProject}* started`
  );

  const routeMigrateGet = promisify(
    dioscuri.ns(openshiftProject).routemigrates(openshiftProject).get
  );

  // this will check the resource in openshift, then updates the task in the api
  const updateActiveStandbyTask = () => {
    return (new Promise(async (resolve, reject) => {
      let exitResolve = false;
      const routeMigrateStatus = await routeMigrateGet();
      if (routeMigrateStatus === undefined || routeMigrateStatus.status === undefined || routeMigrateStatus.status.conditions === undefined) {
        logger.info(`${openshiftProject}: active/standby switch not ready, will try again in 2sec`);
      } else {
        for (let i = 0; i < routeMigrateStatus.status.conditions.length; i++) {
          switch (routeMigrateStatus.status.conditions[i].type ) {
            case 'started':
              // update the task to started
              var created = convertDateFormat(routeMigrateStatus.status.conditions[i].lastTransitionTime)
              await updateTask(parseInt(task.id), {
                status: 'ACTIVE',
                created: created,
              });
              break;
            case 'failed':
              // update the task to failed
              var created = convertDateFormat(routeMigrateStatus.status.conditions[i].lastTransitionTime)
              await updateTask(parseInt(task.id), {
                status: 'FAILED',
                completed: created,
              });
              var condition: any = new Object();
              // send a log off with the status information
              condition.condition = routeMigrateStatus.status.conditions[i].condition
              condition.activeRoutes = routeMigrateStatus.spec.routes.activeRoutes
              condition.standbyRoutes = routeMigrateStatus.spec.routes.standbyRoutes
              var conditionStr= JSON.stringify(condition);
              await saveTaskLog(
                'active-standby-switch',
                projectOpenShift.name,
                'failed',
                task.uuid,
                conditionStr,
              );
              logger.info(`${openshiftProject}: active/standby switch failed`);
              exitResolve = true;
              break;
            case 'completed':
              // swap the active/standby in lagoon by updating the project
              const response = await updateProject(projectOpenShift.id, {
                productionEnvironment: safeStandbyProductionEnvironment,
                standbyProductionEnvironment: safeActiveProductionEnvironment,
                productionRoutes: routeMigrateStatus.spec.routes.activeRoutes,
                standbyRoutes: routeMigrateStatus.spec.routes.standbyRoutes,
              });
              // update the task to completed
              var created = convertDateFormat(routeMigrateStatus.status.conditions[i].lastTransitionTime)
              await updateTask(parseInt(task.id), {
                status: 'SUCCEEDED',
                completed: created,
              });
              // send a log off with the status information
              var condition: any = new Object();
              condition.condition = routeMigrateStatus.status.conditions[i].condition
              condition.activeRoutes = routeMigrateStatus.spec.routes.activeRoutes
              condition.standbyRoutes = routeMigrateStatus.spec.routes.standbyRoutes
              var conditionStr= JSON.stringify(condition);
              await saveTaskLog(
                'active-standby-switch',
                projectOpenShift.name,
                'succeeded',
                task.uuid,
                conditionStr,
              );
              logger.info(`${openshiftProject}: active/standby switch completed`);
              exitResolve = true;
              break;
          }
        }
      }
      // handle the exit here
      if (exitResolve == true) {
        resolve();
      } else {
        logger.info(`${openshiftProject}: active/standby switch not ready, will try again in 2sec`);
        reject();
      }
    }));
  }

  try {
    // actually run the task that updates the task
    await retry(30, updateActiveStandbyTask, 2000);
  } catch (err) {
    throw new Error(
      `${openshiftProject}: active/standby task is taking too long ${err}`
    );
  }
}

const saveTaskLog = async (jobName, projectName, status, uid, log) => {
  const meta = {
    jobName,
    jobStatus: status,
    remoteId: uid
  };

  sendToLagoonLogs(
    'info',
    projectName,
    '',
    `task:misc-openshift:route:migrate:${jobName}`,
    meta,
    log
  );
};
