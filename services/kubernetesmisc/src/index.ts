import { logger } from '@lagoon/commons/dist/local-logging';
import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs';
import { consumeTasks, initSendToLagoonTasks } from '@lagoon/commons/dist/tasks';

import resticRestore from './handlers/resticRestore';
import kubernetesBuildCancel from "./handlers/kubernetesBuildCancel";

initSendToLagoonLogs();
initSendToLagoonTasks();

const messageConsumer = async msg => {

  const { key, data, data: { project } } = JSON.parse(msg.content.toString());

  logger.verbose(
    `Received MiscKubernetes message for key: ${key}`
  );

  switch(key) {
    case 'kubernetes:restic:backup:restore':
      resticRestore(data);
      break;

    case 'kubernetes:build:cancel':
      kubernetesBuildCancel(data);
      break;

    default:
      const meta = {
        msg: JSON.parse(msg.content.toString()),
      };
      sendToLagoonLogs(
        'info',
        project.name,
        '',
        'task:misc-kubernetes;unhandled',
        meta,
        `*[${project.name}]* Unhandled MISC task ${key}`
      );
  }

};

const deathHandler = async (msg, lastError) => {
  const { key, data: { project } } = JSON.parse(msg.content.toString());

  sendToLagoonLogs(
    'error',
    project.name,
    '',
    'task:misc-kubernetes:error',
    {},
    `*[${project.name}]* MISC Task \`${key}\` ERROR:
\`\`\`
${lastError}
\`\`\``
  );
};

const retryHandler = async (msg, error, retryCount, retryExpirationSecs) => {
  const { key, data: { project } } = JSON.parse(msg.content.toString());

  sendToLagoonLogs(
    'warn',
    project,
    '',
    'task:misc-kubernetes:retry',
    {
      error: error.message,
      msg: JSON.parse(msg.content.toString()),
      retryCount: 1
    },
    `*[${project.name}]* MISC Task \`${key}\` ERROR:
\`\`\`
${error.message}
\`\`\`
Retrying in ${retryExpirationSecs} secs`
  );
};

consumeTasks('misc-kubernetes', messageConsumer, retryHandler, deathHandler);
