// @flow

const R = require('ramda');
const { query } = require('../../util/db');
const Sql = require('./sql');

/* ::

import type {Cred, CredMaybe, SqlObj} from '../';
import type MariaSQL from 'mariasql';

*/

const Helpers = (sqlClient /* : MariaSQL */) => {
  const getAssignedNotificationPids = async (
    { name, type } /* : { name: string, type: string } */,
  ) => {
    const result = await query(
      sqlClient,
      Sql.selectProjectNotificationByNotificationName({ name, type }),
    );

    return R.map(R.prop('pid'), result);
  };

  return {
    getAssignedNotificationPids,
    getAssignedNotificationIds: async (
      { name, type } /* : { name: string, type: string } */,
    ) => {
      const result = await query(
        sqlClient,
        Sql.selectProjectNotificationByNotificationName({ name, type }),
      );

      return R.map(R.prop('nid'), result);
    },
    isAllowedToModify: async (
      { role, permissions: { projects } } /* : CredMaybe */,
      { name } /* : { name: string } */,
    ) => {
      if (role === 'admin') {
        return true;
      }

      const pids = await getAssignedNotificationPids({
        name,
        type: 'slack',
      });

      if (!R.isEmpty(pids) && projects) {
        const hasAccess = R.compose(
          R.not,
          R.isEmpty,
          R.intersection(projects),
        )(pids);

        return hasAccess;
      }
      return true;
    },
  };
};

module.exports = Helpers;
