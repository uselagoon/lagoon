const promisify = require("util").promisify;
const R = require("ramda");
import { logger } from "@lagoon/commons/dist/local-logging";
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { getOpenShiftInfoForProject, updateProject, updateTask } from '@lagoon/commons/dist/api';
import { RouteMigration } from '@lagoon/commons/dist/openshiftApi';
const convertDateFormat = R.init;

import Api, { ClientConfiguration } from 'kubernetes-client';
const Client = Api.Client1_13;

const getConfig = (url, token) => ({
  url,
  insecureSkipTlsVerify: true,
  auth: {
    bearer: token
  }
});

const pause = duration => new Promise(res => setTimeout(res, duration));
const retry = (retries, fn, delay = 1000) =>
  fn().catch(
    err =>
      retries > 1
        ? pause(delay).then(() => retry(retries - 1, fn, delay))
        : Promise.reject(err)
  );

export async function ingressMigration (data) {
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

  // define the ingressmigration. the annotation being set to true is what actually triggers the switch
  const migrateRoutes = (openshiftProject, destinationOpenshiftProject) => {
    let config = {
      apiVersion: 'dioscuri.amazee.io/v1',
      kind: 'IngressMigrate',
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

  const config: ClientConfiguration = getConfig(openshiftConsole, openshiftToken);
  const client = new Client({ config });

  const ingressMigratesGet = promisify(
    dioscuri.ns(openshiftProject).ingressmigrates.get
  );

  const ingressMigrateDelete = async name => {
    const deleteFn = promisify(dioscuri.ns(openshiftProject).ingressmigrates(openshiftProject).delete);
    return deleteFn({
      body: {}
    });
  };

  const hasNoRouteMigrate = () =>
    new Promise(async (resolve, reject) => {
      const ingressMigrates = await ingressMigratesGet();
      if (ingressMigrates.items.length === 0) {
        logger.info(`${openshiftProject}: RouteMigrate deleted`);
        resolve();
      } else {
        logger.info(
          `${openshiftProject}: RouteMigrate not deleted yet, will try again in 2sec`
        );
        reject();
      }
    });

    const projectExists = async (client, namespace) => {
      const namespaces = await client.api.v1.namespaces(namespace).get();
      if (
        namespaces.statusCode !== 200 &&
        namespaces.body.metadata.name !== namespace
      ) {
        return false;
      }

      return true;
    };

    if (!(await projectExists(client, openshiftProject))) {
      logger.error(`Project ${openshiftProject} does not exist, bailing`);
      return;
    }
    if (!(await projectExists(client, destinationOpenshiftProject))) {
      logger.error(`Project ${destinationOpenshiftProject} does not exist, bailing`);
      return;
    }

  // check if there is already a ingress migrate resource, delete it if there is
  try {
    const ingressMigrates = await ingressMigratesGet();
    for (let ingressMigrate of ingressMigrates.items) {
      await ingressMigrateDelete(ingressMigrate.metadata.name);
      logger.info(
        `${openshiftProject}: Deleting IngressMigrate ${ingressMigrate.metadata.name}`
      );
    }
    // RouteMigrates are deleted quickly, but we still have to wait before we attempt to create the new one
    try {
      await retry(30, hasNoRouteMigrate, 2000);
    } catch (err) {
      throw new Error(
        `${openshiftProject}: IngressMigrate not deleted`
      );
    }
  } catch (err) {
      logger.info(`${openshiftProject}: IngressMigrate doesn't exist`); // proceed if it doesn't exist
  }

  // add the ingressmigrate resource
  try {
    const ingressMigratePost = promisify(
        dioscuri.ns(openshiftProject).ingressmigrates.post
    );
    await ingressMigratePost({
      body: migrateRoutes(openshiftProject, destinationOpenshiftProject)
    });
    logger.verbose(`${openshiftProject}: IngressMigrate resource created`);
  } catch (err) {
      logger.error(err);
      throw new Error();
  }

  sendToLagoonLogs(
    'info',
    project.name,
    '',
    'task:misc-kubernetes:route:migrate',
    data,
    `*[${project.name}]* Ingress Migration between environments *${destinationOpenshiftProject}* started`
  );

  const ingressMigrateGet = promisify(
    dioscuri.ns(openshiftProject).ingressmigrates(openshiftProject).get
  );

  // this will check the resource in openshift, then updates the task in the api
  const updateActiveStandbyTask = () => {
    return (new Promise(async (resolve, reject) => {
      let exitResolve = false;
      const ingressMigrateStatus = await ingressMigrateGet();
      if (ingressMigrateStatus === undefined || ingressMigrateStatus.status === undefined || ingressMigrateStatus.status.conditions === undefined) {
        logger.info(`${openshiftProject}: active/standby switch not ready, will try again in 2sec`);
      } else {
        for (let i = 0; i < ingressMigrateStatus.status.conditions.length; i++) {
          switch (ingressMigrateStatus.status.conditions[i].type ) {
            case 'started':
              // update the task to started
              var created = convertDateFormat(ingressMigrateStatus.status.conditions[i].lastTransitionTime)
              await updateTask(parseInt(task.id), {
                status: 'ACTIVE',
                created: created,
              });
              break;
            case 'failed':
              // update the task to failed
              var created = convertDateFormat(ingressMigrateStatus.status.conditions[i].lastTransitionTime)
              await updateTask(parseInt(task.id), {
                status: 'FAILED',
                completed: created,
              });
              var condition: any = new Object();
              // send a log off with the status information
              condition.condition = ingressMigrateStatus.status.conditions[i].condition
              condition.activeRoutes = ingressMigrateStatus.spec.ingress.activeIngress
              condition.standbyRoutes = ingressMigrateStatus.spec.ingress.standbyIngress
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
                productionRoutes: ingressMigrateStatus.spec.ingress.activeIngress,
                standbyRoutes: ingressMigrateStatus.spec.ingress.standbyIngress,
              });
              // update the task to completed
              var created = convertDateFormat(ingressMigrateStatus.status.conditions[i].lastTransitionTime)
              await updateTask(parseInt(task.id), {
                status: 'SUCCEEDED',
                completed: created,
              });
              // send a log off with the status information
              var condition: any = new Object();
              condition.condition = ingressMigrateStatus.status.conditions[i].condition
              condition.activeRoutes = ingressMigrateStatus.spec.ingress.activeIngress
              condition.standbyRoutes = ingressMigrateStatus.spec.ingress.standbyIngress
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
    `task:misc-kubernetes:route:migrate:${jobName}`,
    meta,
    log
  );
};

export default ingressMigration;