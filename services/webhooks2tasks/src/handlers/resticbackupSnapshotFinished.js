// @flow

const moment = require('moment');

const {
  sendToLagoonLogs
} = require('@lagoon/commons/src/logs');
const {
  addBackup,
  getEnvironmentByOpenshiftProjectName
} = require('@lagoon/commons/src/api');
const R = require('ramda');

import type {
  WebhookRequestData
} from '../types';

async function resticbackupSnapshotFinished(webhook: WebhookRequestData) {
  const {
    webhooktype,
    event,
    uuid,
    body
  } = webhook;

  try {
    const environmentName = R.prop('name', body);
    const currentSnapshot = R.compose(R.last, R.prop('snapshots'))(body)
    const hostname = R.prop('hostname', currentSnapshot);
    const backupId = R.prop('id', currentSnapshot);
    // mariadb expects a specific timeformat of 'YYYY-MM-DD HH:mm:ss'
    const created = moment(R.prop('time', currentSnapshot)).format('YYYY-MM-DD HH:mm:ss');
    const environment = await getEnvironmentByOpenshiftProjectName(environmentName);

    // Hostname can be two different type of things:
    // 1. The same as the environmentName which means that all files are backed up there
    // 2. Ending with a suffix like `projectname-mariadb` in which case the backup contains the `mariadb` backup
    let source;
    if (hostname == environmentName) {
      source = 'files';
    } else {
      source = hostname.replace(`${environmentName}-`,'');
    }

    const meta = {
      data: currentSnapshot,
      backupId: backupId,
      project: environment.environmentByOpenshiftProjectName.project.name,
      source: source
    };

    await addBackup(null, environment.environmentByOpenshiftProjectName.id, source, backupId, created);

    sendToLagoonLogs(
      'info',
      '',
      uuid,
      `${webhooktype}:${event}:imported`,
      meta,
      `Created backup ${backupId} for environment ${environmentName}`
    );

    return;
  } catch (error) {
    sendToLagoonLogs(
      'error',
      '',
      uuid,
      `${webhooktype}:${event}:error`, {
        data: body
      },
      `Could not create backup, reason: ${error}`
    );

    return;
  }
}

module.exports = resticbackupSnapshotFinished;