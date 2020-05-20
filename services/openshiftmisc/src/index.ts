import { logger } from '@lagoon/commons/dist/local-logging';
import {
  sendToLagoonLogs,
  initSendToLagoonLogs
} from '@lagoon/commons/dist/logs';
import {
  consumeTasks,
  initSendToLagoonTasks,
} from '@lagoon/commons/dist/tasks';
import { resticRestore } from './handlers/resticRestore';
import { routeMigration } from './handlers/routeMigration';
import { openshiftBuildCancel } from './handlers/openshiftBuildCancel';

initSendToLagoonLogs();
initSendToLagoonTasks();

const messageConsumer = async msg => {
  const { key, data, data: { project } } = JSON.parse(msg.content.toString());

  logger.verbose(
    `Received MISCOpenshift message for key: ${key}`
  );

  switch(key) {
    case 'openshift:restic:backup:restore':
      resticRestore(data);
      break;

    case 'openshift:route:migrate':
      routeMigration(data);
      break;

    case 'openshift:build:cancel':
      openshiftBuildCancel(data);
      break;

    default:
      const meta = {
        msg: JSON.parse(msg.content.toString()),
      };
      sendToLagoonLogs(
        'info',
        project.name,
        '',
        'task:misc-openshift;unhandled',
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
    'task:misc-openshift:error',
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
    'task:misc-openshift:retry',
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

consumeTasks('misc-openshift', messageConsumer, retryHandler, deathHandler);
