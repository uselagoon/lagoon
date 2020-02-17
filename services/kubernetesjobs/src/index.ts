import { promisify } from 'util';
import * as R from 'ramda';

import Api, { ClientConfiguration } from 'kubernetes-client';
const Client = Api.Client1_13;

const { logger } = require('@lagoon/commons/src/local-logging');
const { getOpenShiftInfoForProject, updateTask } = require('@lagoon/commons/src/api');
const { sendToLagoonLogs, initSendToLagoonLogs } = require('@lagoon/commons/src/logs');
const { consumeTasks, initSendToLagoonTasks, createTaskMonitor } = require('@lagoon/commons/src/tasks');

const lagoonApiRoute = R.compose(
  // Default to the gateway IP in virtualbox, so pods running in minishift can
  // connect to docker-for-mac containers.
  R.defaultTo('http://10.0.2.2:3000'),
  R.find(R.test(/api-/)),
  R.split(','),
  R.propOr('', 'LAGOON_ROUTES')
)(process.env);

const lagoonSshHost = R.propOr('ssh.lagoon.svc', 'LAGOON_SSH_HOST', process.env);
const lagoonSshPort = R.propOr('2020', 'LAGOON_SSH_PORT', process.env);

initSendToLagoonLogs();
initSendToLagoonTasks();

const failTask = async taskId => {
  try {
    await updateTask(taskId, {
      status: 'FAILED',
    });
  } catch (error) {
    logger.error(
      `Could not fail task ${taskId}. Message: ${error}`
    );
  }
}

const messageConsumer = async msg => {
  const { project, task, environment } = JSON.parse(msg.content.toString());

  logger.verbose(
    `Received Kubernetesjobs task for project: ${project.name}, task: ${task.id}`
  );

  const taskId = typeof task.id === 'string' ? parseInt(task.id, 10) : task.id;

  const projectResult = await getOpenShiftInfoForProject(project.name);
  const projectOpenShift = projectResult.project;

  try {
    var kubernetesConsole = projectOpenShift.openshift.consoleUrl.replace(/\/$/, "");
    var kubernetesToken = projectOpenShift.openshift.token || ""
  } catch(error) {
    logger.warn(`Error while loading information for project ${project.name}: ${error}`)
    throw(error)
  }

  const clientConfiguration: ClientConfiguration = {
    url: kubernetesConsole,
    insecureSkipTlsVerify: true,
    auth: {
      bearer: kubernetesToken
    },
  };
  
  const client = new Client({ config : clientConfiguration});


  const ocsafety = string =>
    string.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-');

  try {
    var safeBranchName = ocsafety(environment.name);
    var safeProjectName = ocsafety(project.name);
    // var openshiftConsole = projectOpenShift.openshift.consoleUrl.replace(
    //   /\/$/,
    //   ''
    // );
    // var openshiftToken = projectOpenShift.openshift.token || '';
    var openshiftProject = projectOpenShift.openshiftProjectPattern
      ? projectOpenShift.openshiftProjectPattern
          .replace('${branch}', safeBranchName)
          .replace('${project}', safeProjectName)
      : `${safeProjectName}-${safeBranchName}`;
    var jobName = `${openshiftProject}-${task.id}`;
  } catch (error) {
    logger.error(`Error while loading information for project ${project.name}`);
    logger.error(error);
    throw error;
  }

  const jobConfig = (name, spec) => {
    let config = {
      apiVersion: 'batch/v1',
      kind: 'Job',
      metadata: {
        name
      },
      spec: {
        parallelism: 1,
        completions: 1,
        backoffLimit: 0,
        template: {
          metadata: {
            name: 'pi'
          },
          spec: {
            ...spec,
            restartPolicy: 'Never'
          }
        }
      }
    };

    return config;
  };

  // Check if project exists
  try {
    const namespaces = await client.api.v1.namespaces(openshiftProject).get();
    // An empty list means the namespace does not exist
    if (namespaces.statusCode !== 200 && namespaces.body.metadata.name !== openshiftProject) {
      logger.error(`Project ${openshiftProject} does not exist, bailing`)
      return; // we are done here
    }
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  // Get pod spec for desired service
  let taskPodSpec;
  try {

    // const podsGet = promisify(kubernetesCore.namespaces(openshiftProject).pods.get)
    // const pods = await podsGet()

    // const serviceNames = pods.items.reduce(
    //   (names, pod) => [
    //     ...names,
    //     ...pod.spec.containers.reduce(
    //       (names, container) => [
    //         ...names,
    //         container.name
    //       ],
    //       []
    //     )
    //   ],
    //   []
    // );

    const deployment = await client.apis.app.v1.namespaces(openshiftProject).deployments.get()

    // const deploymentConfigsGet = promisify(openshift.ns(openshiftProject).deploymentconfigs.get);
    // const deploymentConfigs = await deploymentConfigsGet();

    const oneContainerPerSpec = deployment.body.items.reduce(
      (specs, deploymentConfig) => ({
        ...specs,
        ...deploymentConfig.spec.template.spec.containers.reduce(
          (specs, container) => ({
            ...specs,
            [container.name]: {
              ...deploymentConfig.spec.template.spec,
              containers: [container]
            }
          }),
          {}
        )
      }),
      {}
    );

    // task.service is looking for "cli"
    // TODO: we have "cli-persistent --- what's the difference???"
    // CHANGED TO cli-persistent for testing in 
    // src/resources/task/resolvers.js

    
    if (!(oneContainerPerSpec[task.service] || oneContainerPerSpec[`${task.service}-persistent`])) {
      logger.error(`No spec for service ${task.service}, bailing`);
      failTask(taskId);
      return;
    }

    const cronjobEnvVars = env => env.name === 'CRONJOBS';
    const containerEnvLens = R.lensPath(['containers', 0, 'env']);
    const removeCronjobs = R.over(containerEnvLens, R.reject(cronjobEnvVars));
    const addTaskEnvVars = R.over(containerEnvLens, R.concat([
      {
        name: 'TASK_API_HOST',
        value: lagoonApiRoute,
      },
      {
        name: 'TASK_SSH_HOST',
        value: lagoonSshHost,
      },
      {
        name: 'TASK_SSH_PORT',
        value: lagoonSshPort,
      },
      {
        name: 'TASK_DATA_ID',
        value: `${taskId}`,
      },
    ]));

    const containerCommandLens = R.lensPath(['containers', 0, 'command']);
    const setContainerCommand = R.set(containerCommandLens, [
      '/sbin/tini',
      '--',
      '/lagoon/entrypoints.sh',
      '/bin/sh',
      '-c',
      task.command,
    ]);

    taskPodSpec = R.pipe(
      R.prop(`${task.service}-persistent`),
      removeCronjobs,
      addTaskEnvVars,
      setContainerCommand,
    )(oneContainerPerSpec);
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }

  // Create a new kubernetes job to run the lagoon task
  let openshiftJob;
  try {

    // TODO: Do we need to check whether or not the job already exists? 
    openshiftJob = await client.apis.batch.v1.namespaces(openshiftProject).jobs.post({ body: jobConfig(jobName, taskPodSpec)})
    // const jobConfigPost = promisify(kubernetesBatchApi.namespaces(openshiftProject).jobs.post);
    // openshiftJob = await jobConfigPost({ body: jobConfig(jobName, taskPodSpec)});
  } catch (err) {
    logger.error(err);
    throw new Error();
  }

  // Update lagoon task
  let updatedTask;
  try {
    const convertDateFormat = R.init;
    const dateOrNull = R.unless(R.isNil, convertDateFormat);

    updatedTask = await updateTask(taskId, {
      remoteId: openshiftJob.body.metadata.uid,
      created: convertDateFormat(openshiftJob.body.metadata.creationTimestamp),
      started: dateOrNull(openshiftJob.body.metadata.creationTimestamp)
    });
  } catch (error) {
    logger.error(
      `Could not update task ${project.name} ${task.name}. Message: ${error}`
    );
  }

  logger.verbose(`${openshiftProject}: Running job: ${task.name}`);

  const monitorPayload = {
    task: updatedTask.updateTask,
    project,
    environment
  };

  const taskMonitorLogs = await createTaskMonitor(
    'job-kubernetes',
    monitorPayload
  );

  sendToLagoonLogs(
    'start',
    project.name,
    '',
    'task:job-kubernetes:start',
    {},
    `*[${project.name}]* Task \`${task.id}\` *${task.name}* started`
  );
};

const deathHandler = async (msg, lastError) => {
  const { project, task } = JSON.parse(msg.content.toString());

  failTask(task.id);

  sendToLagoonLogs(
    'error',
    project.name,
    '',
    'task:job-kubernetes:error',
    {},
    `*[${project.name}]* Task \`${task.id}\` *${task.name}* ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const { project, task } = JSON.parse(msg.content.toString());

  sendToLagoonLogs(
    'warn',
    project.name,
    '',
    'task:job-kubernetes:retry',
    {
      error: error.message,
      msg: JSON.parse(msg.content.toString()),
      retryCount: 1
    },
    `*[${project.name}]* Task \`${task.id}\` *${task.name}* ERROR:
\`\`\`
${error.message}
\`\`\`
Retrying job in ${retryExpirationSecs} secs`
  );
};

consumeTasks('job-kubernetes', messageConsumer, retryHandler, deathHandler);
