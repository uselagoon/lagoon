import { MariaClient } from 'mariasql';
// import * as R from 'ramda';
// import { asyncPipe } from '@lagoon/commons/src/util';
// import { keycloakAdminClient } from '../clients/keycloakClient';
// import pickNonNil from '../util/pickNonNil';
// import * as logger from '../logger';
// import GroupRepresentation from 'keycloak-admin/lib/defs/groupRepresentation';
// import { User, transformKeycloakUsers } from './user';
// import {
//   loadGroupById,
//   loadGroupByName,
//   getProjectsFromGroupAndSubgroups,
//   Group,
// } from './group';
import * as moment from 'moment';

import { getSqlClient } from '../clients/sqlClient';

import * as esClient from '../clients/esClient';
import { prepare, query } from '../util/db';
// import Helpers from './helpers';
// import Sql from './sql';
// import projectSql from '../project/sql';
// import projectHelpers from '../project/helpers';

export interface Environment {
  id?: number; // int(11) NOT NULL AUTO_INCREMENT,
  name?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  project?: Number; // int(11) DEFAULT NULL,
  deploy_type?: string; // enum('branch','pullrequest','promote') COLLATE utf8_bin DEFAULT NULL,
  environment_type?: string; //  enum('production','development') COLLATE utf8_bin NOT NULL,
  openshift_project_name?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  updated?: string; // timestamp NOT NULL DEFAULT current_timestamp(),
  created?: string; //  timestamp NOT NULL DEFAULT current_timestamp(),
  deleted?: string; // timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  route?: string; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  routes?: string; // text COLLATE utf8_bin DEFAULT NULL,
  monitoring_urls?: string; // text COLLATE utf8_bin DEFAULT NULL,
  auto_idle?: Boolean; // int(1) NOT NULL DEFAULT 1,
  deploy_base_ref?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  deploy_head_ref?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  deploy_title?: string; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
}

interface EnvironmentData {
  id: string;
  name: string;
  type: string;
  hits: any;
  storage: any;
  hours: any;
}

type projectEnvWithDataType = (
  pid: string,
  month: string,
  sqlClient: MariaClient,
) => Promise<EnvironmentData[]>;

export const projectEnvironmentsWithData: projectEnvWithDataType = async (
  pid,
  month,
  sqlClient = getSqlClient(),
) => {
  const environments = await projectEnvironments(pid, null, true, sqlClient);
  const data = (await Promise.all(
    environments.map(
      async ({ id: eid, openshift_project_name: openshift }) => ({
        eid,
        data: { ...(await environmentData(eid, month, openshift)) },
      }),
    ),
  )).reduce((obj, item) => ({ ...obj, [item.eid]: { ...item.data } }), {});

  return environments.map(env => ({
    id: env.id,
    name: env.name,
    type: env.environment_type,
    ...data[env.id],
  }));
};

/**
 * Generates a function that gets all environments for a project.
 *
 * @param {string} month The billing month we want to get data for.
 * @param {string} pid The project id.
 * @param {MariaClient} sqlClient The SQL Client.
 *
 * @return {Function} A function that takes a project and returns all project environments
 */
export const projectEnvironments = async (
  pid,
  type,
  includeDeleted = false,
  sqlClient = getSqlClient(),
) => {
  const prep = prepare(
    sqlClient,
    ` SELECT *
      FROM environment e
      WHERE e.project = :pid
      ${includeDeleted ? '' : 'AND deleted = "0000-00-00 00:00:00"'}
      ${type ? 'AND e.environment_type = :type' : ''}`,
  );

  const environments: [Environment] = await query(
    sqlClient,
    prep({ pid, includeDeleted, type }),
  );
  return environments;
};
export const environmentsByProjectId = projectEnvironments;

// Needed for local Dev - Required if not connected to openshift
export const errorCatcherFn = (msg, responseObj) => err => {
  console.log(`${msg}: ${err.status} : ${err.message}`);
  return { ...responseObj };
};

/**
 * Generates a function that gets billing data from an environment.
 *
 * @param {string} month The billing month we want to get data for.
 * @param {number} eid this includes the context passed from.
 *
 * @return {Function} A function that takes an environment and returns billing data
 */
export const environmentData = async (
  eid: number,
  month: string,
  openshiftProjectName: string,
) => {
  const hits = await environmentHitsMonthByEnvironmentId(
    openshiftProjectName,
    month,
  ).catch(errorCatcherFn('getHits', { total: 0 }));

  const storage = await environmentStorageMonthByEnvironmentId(
    eid,
    month,
  ).catch(errorCatcherFn('getStorage', { bytesUsed: 0 }));
  const hours = await environmentHoursMonthByEnvironmentId(eid, month).catch(
    errorCatcherFn('getHours', { hours: 0 }),
  );

  return { hits, storage, hours };
};

export const environmentStorageMonthByEnvironmentId = async (
  eid,
  month,
  sqlClient = getSqlClient(),
) => {
  const str = `
    SELECT
      SUM(bytes_used) as bytes_used, max(DATE_FORMAT(updated, '%Y-%m')) as month
    FROM
      environment_storage
    WHERE
      environment = :eid
      AND YEAR(updated) = YEAR(STR_TO_DATE(:month, '%Y-%m'))
      AND MONTH(updated) = MONTH(STR_TO_DATE(:month, '%Y-%m'))
  `;

  const prep = prepare(sqlClient, str);
  const rows = await query(sqlClient, prep({ eid, month: month }));
  return rows[0];
};

export const environmentHoursMonthByEnvironmentId = async (
  eid: number,
  yearMonth: string,
  sqlClient = getSqlClient(),
) => {
  const str = `SELECT e.created, e.deleted FROM environment e WHERE e.id = :eid`;
  const prep = prepare(sqlClient, str);
  const rows = await query(sqlClient, prep({ eid }));

  const { created, deleted } = rows[0];

  const created_date = new Date(created);
  const deleted_date = new Date(deleted);

  const now = new Date();

  // Generate date object of the requested month, but with the first day, hour, minute, seconds and milliseconds
  const interested_month_start = new Date(yearMonth) || new Date();
  interested_month_start.setDate(1);
  interested_month_start.setHours(0);
  interested_month_start.setMinutes(0);
  interested_month_start.setSeconds(0);
  interested_month_start.setMilliseconds(0);

  if (interested_month_start > now) {
    throw new Error("Can't predict the future, yet.");
  }

  // Generate Date Variable with the month we are interested in plus one month
  let interested_month_end = new Date(interested_month_start);
  interested_month_end.setMonth(interested_month_start.getMonth() + 1);

  // If the the the interested month end is in the future, we use the current time for real time cost calculations
  if (interested_month_end > now) {
    interested_month_end = now;
  }

  // calculate the month in format `YYYY-MM`. getMonth() does not return with a leading zero and starts its index at 0 as well.
  const month_leading_zero =
    interested_month_start.getMonth() + 1 < 10
      ? `0${interested_month_start.getMonth() + 1}`
      : interested_month_start.getMonth() + 1;
  const month = `${interested_month_start.getFullYear()}-${month_leading_zero}`;

  // Created Date is created after the interested month: Ran for 0 hours in the requested month
  if (created_date > interested_month_end) {
    return { month, hours: 0 };
  }

  // Environment was deleted before the month we are interested in: Ran for 0 hours in the requested month
  if (
    deleted_date < interested_month_start &&
    moment(deleted_date).format('YYYY-MM-DD HH:mm:ss') !== '0000-00-00 00:00:00'
  ) {
    return { month, hours: 0 };
  }

  let date_from;
  let date_to;

  if (created_date >= interested_month_start) {
    // Environment was created within the interested month
    date_from = created_date;
  } else {
    // Environment was created before the interested month
    date_from = interested_month_start;
  }

  if (
    deleted === '0000-00-00 00:00:00' ||
    deleted_date > interested_month_end
  ) {
    // Environment is not deleted yet or was deleted after the interested month
    date_to = interested_month_end;
  } else {
    // Environment was deleted in the interested month
    date_to = deleted_date;
  }

  const hours = Math.ceil(Math.abs(date_to - date_from) / 36e5);
  return { month, hours };
};

export const environmentHitsMonthByEnvironmentId = async (
  openshiftProjectName,
  yearMonth,
) => {
  const interested_date = yearMonth ? new Date(yearMonth) : new Date();
  const year = interested_date.getFullYear();
  const month = interested_date.getMonth() + 1;
  // This generates YYYY-MM
  const interested_year_month = `${year}-${month < 10 ? `0${month}` : month}`;
  try {
    const result = await esClient.count({
      index: `router-logs-${openshiftProjectName}-*`,
      body: {
        query: {
          bool: {
            must: [
              {
                range: {
                  '@timestamp': {
                    gte: `${interested_year_month}||/M`,
                    lte: `${interested_year_month}||/M`,
                  },
                },
              },
            ],
            must_not: [
              {
                match_phrase: {
                  request_header_useragent: {
                    query: 'StatusCake',
                  },
                },
              },
            ],
          },
        },
      },
    });

    const response = {
      total: result.count,
    };
    return response;
  } catch (e) {
    if (
      e.body.error.type &&
      (e.body.error.type === 'index_not_found_exception' ||
        e.body.error.type === 'security_exception')
    ) {
      return { total: 0 };
    }
    throw e;
  }
};

export default {
  projectEnvironments,
  environmentsByProjectId,
  environmentData,
  environmentStorageMonthByEnvironmentId,
  environmentHoursMonthByEnvironmentId,
  environmentHitsMonthByEnvironmentId,
};
