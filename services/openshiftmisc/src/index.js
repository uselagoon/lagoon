// @flow

const R = require('ramda');
const { logger } = require('@lagoon/commons/src/local-logging');
const {
  sendToLagoonLogs,
  initSendToLagoonLogs
} = require('@lagoon/commons/src/logs');
const {
  consumeTasks,
  initSendToLagoonTasks,
  createTaskMonitor
} = require('@lagoon/commons/src/tasks');
const resticRestore = require('./handlers/resticRestore');

initSendToLagoonLogs();
initSendToLagoonTasks();

const messageConsumer = async msg => {
  const { key, data, data: { project } } = JSON.parse(msg.content.toString());

  logger.verbose(
    `Received MISCOpenshift message for key: ${key}`
  );

  switch(key) {
    case 'restic:backup:restore':
      resticRestore(data);
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
