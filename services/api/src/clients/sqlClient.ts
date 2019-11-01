import * as Client from 'mariasql';

import * as logger from '../logger';

export const getSqlClient = () => {
  const sqlClient = new Client({
    host: 'api-db',
    port: 3306,
    user: 'api',
    password: 'api',
    db: 'infrastructure',
  });

  sqlClient.on('error', error => {
    logger.error(error.message);
  });

  return sqlClient;
};

module.exports = {
  getSqlClient,
};
