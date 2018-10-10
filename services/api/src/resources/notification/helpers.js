// @flow

const R = require('ramda');
const sqlClient = require('../../clients/sqlClient');
const { query } = require('../../util/db');
const Sql = require('./sql');

/* ::

import type {Cred, CredMaybe, SqlObj} from '../';

*/

const Helpers = {
  getAssignedNotificationIds: async (
    { name, type } /* : { name: string, type: string } */,
  ) => {
    const result = await query(
      sqlClient,
      Sql.selectProjectNotificationByNotificationName({ name, type }),
    );

    return R.map(R.prop('nid'), result);
  },
  getAssignedNotificationPids: async (
    { name, type } /* : { name: string, type: string } */,
  ) => {
    const result = await query(
      sqlClient,
      Sql.selectProjectNotificationByNotificationName({ name, type }),
    );

    return R.map(R.prop('pid'), result);
  },
  isAllowedToModify: async (
    { role, permissions: { projects } } /* : CredMaybe */,
    { name } /* : { name: string } */,
  ) => {
    if (role === 'admin') {
      return true;
    }

    const pids = await Helpers.getAssignedNotificationPids({
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

module.exports = Helpers;
