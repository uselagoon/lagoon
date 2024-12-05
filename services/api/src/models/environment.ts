import moment from 'moment';
import { Pool } from 'mariadb';
import { query, knex } from '../util/db';
import { logger } from '../loggers/logger';
import { esClient } from '../clients/esClient';

export interface Environment {
  id?: number; // int(11) NOT NULL AUTO_INCREMENT,
  name?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  project?: Number; // int(11) DEFAULT NULL,
  deployType?: string; // enum('branch','pullrequest','promote') COLLATE utf8_bin DEFAULT NULL,
  environmentType?: string; //  enum('production','development') COLLATE utf8_bin NOT NULL,
  openshiftProjectName?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  updated?: string; // timestamp NOT NULL DEFAULT current_timestamp(),
  created?: string; //  timestamp NOT NULL DEFAULT current_timestamp(),
  deleted?: string;
  route?: string; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
  routes?: string; // text COLLATE utf8_bin DEFAULT NULL,
  autoIdle?: Boolean; // int(1) NOT NULL DEFAULT 1,
  deployBaseRef?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  deployHeadRef?: string; // varchar(100) COLLATE utf8_bin DEFAULT NULL,
  deployTitle?: string; // varchar(300) COLLATE utf8_bin DEFAULT NULL,
}

export interface EnvironmentModel {
  projectEnvironments: (pid, type, includeDeleted) => any;
  environmentsByProjectId: (pid, type, includeDeleted) => any;
  environmentStorageMonthByEnvironmentId: (eid, month) => any;
  environmentHoursMonthByEnvironmentId: (eid: number, yearMonth: string) => any;
  environmentHitsMonthByEnvironmentId: (
    project,
    openshiftProjectName,
    yearMonth,
  ) => any;
  calculateHitsFromESData: (legacyResult: any, newResult: any) => any;
}

export const Environment = (clients: {
  sqlClientPool: Pool;
}): EnvironmentModel => {
  const { sqlClientPool } = clients;

  /**
   * Get all environments for a project.
   *
   * @param {string} pid The project id.
   * @param {string} type The environment type we're interested in
   * @param {boolean} includeDeleted include deleted environments
   *
   * @return {Promise<[Environments]>} An array of all project environments
   */
  const projectEnvironments = async (pid, type, includeDeleted = false) => {
    let query = knex('environment').where(knex.raw('project = ?', pid));

    if (!includeDeleted) {
      query = query.andWhere('deleted', '0000-00-00 00:00:00');
    }
    if (type) {
      query = query.andWhere(knex.raw('environment_type = ?', type));
    }

    const environments: [Environment] = await query(
      sqlClientPool,
      query.toString(),
    );
    return environments;
  };

  // alias on the above
  const environmentsByProjectId = projectEnvironments;

  // Needed for local Dev - Required if not connected to openshift
  const errorCatcherFn = (msg, responseObj) => (err) => {
    const errMsg =
      err && err.status && err.message
        ? `${err.status} : ${err.message} : ${err.headers} : ${err.url}`
        : `err undefined`;
    logger.error(`${msg}: ${errMsg}`);
    return { ...responseObj };
  };

  const environmentStorageMonthByEnvironmentId = async (eid, month) => {
    let q = knex('environment_storage')
      .select(knex.raw('SUM(kib_used) as kib_used'))
      .select(knex.raw('SUM(kib_used) as bytes_used')) // @DEPRECATE when `bytesUsed` is completely removed, this can be removed
      .select(knex.raw(`max(DATE_FORMAT(updated, '%Y-%m')) as month`))
      .where('environment', eid)
      .andWhere(
        knex.raw(`YEAR(updated) = YEAR(STR_TO_DATE(?, '%Y-%m'))`, month),
      )
      .andWhere(
        knex.raw(`MONTH(updated) = MONTH(STR_TO_DATE(?, '%Y-%m'))`, month),
      );

    const rows = await query(sqlClientPool, q.toString());

    rows.map((row) => ({ ...row, bytesUsed: row.kibUsed })); // @DEPRECATE when `bytesUsed` is completely removed, this can be removed

    return rows[0];
  };

  const environmentHoursMonthByEnvironmentId = async (
    eid: number,
    yearMonth: string,
  ) => {
    const rows = await query(
      sqlClientPool,
      'SELECT e.created, e.deleted FROM environment e WHERE e.id = :eid',
      { eid },
    );

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
      moment(deleted_date).format('YYYY-MM-DD HH:mm:ss') !==
        '0000-00-00 00:00:00'
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

  const fetchElasticSearchHitsData = async (
    project,
    openshiftProjectName,
    interestedYearMonth,
    interestedDateBeginString,
    interestedDateEndString,
  ) => {
    try {
      // LEGACY LOGGING SYSTEM - REMOVE ONCE WE MIGRATE EVERYTHING TO THE NEW SYSTEM
      const legacyQuery = {
        index: `router-logs-${openshiftProjectName}-*`,
        body: {
          size: 0,
          query: {
            bool: {
              must: [
                {
                  range: {
                    '@timestamp': {
                      gte: `${interestedYearMonth}||/M`,
                      lte: `${interestedYearMonth}||/M`,
                      format: 'strict_year_month',
                    },
                  },
                },
              ],
              must_not: [
                {
                  match_phrase: {
                    request_header_useragent: {
                      // Legacy Logging - OpenShift Router: Exclude requests from StatusCake
                      query: 'StatusCake',
                    },
                  },
                },
                {
                  match_phrase: {
                    request_header_useragent: {
                      // Legacy Logging - OpenShift Router: Exclude requests from UptimeRobot
                      query: 'UptimeRobot',
                    },
                  },
                },
                {
                  match_phrase: {
                    http_request: {
                      // Legacy Logging - OpenShift Router: Exclude requests to acme challenges
                      query: 'acme-challenge',
                    },
                  },
                },
              ],
            },
          },
          aggs: {
            hourly: {
              date_histogram: {
                field: '@timestamp',
                fixed_interval: '1h',
                min_doc_count: 0,
                extended_bounds: {
                  min: interestedDateBeginString,
                  max: interestedDateEndString,
                },
              },
              aggs: {
                count: {
                  value_count: {
                    field: '@timestamp',
                  },
                },
              },
            },
            average: {
              avg_bucket: {
                buckets_path: 'hourly>count',
                gap_policy: 'skip', // makes sure that we don't use empty buckets as average calculation
              },
            },
          },
        },
      };
      const legacyResult = await esClient.search(legacyQuery);

      // NEW LOGGING SYSTEM - K8S openshift/HAProxy && kubernetes Nginx/kubernetes logs
      const newQuery = {
        index: `router-logs-${project}-_-*`,
        body: {
          size: 0,
          query: {
            bool: {
              must: [
                {
                  range: {
                    '@timestamp': {
                      gte: `${interestedYearMonth}||/M`,
                      lte: `${interestedYearMonth}||/M`,
                      format: 'strict_year_month',
                    },
                  },
                },
                {
                  match_phrase: {
                    'kubernetes.namespace_name': `${openshiftProjectName}`,
                  },
                },
              ],
              must_not: [
                {
                  match_phrase: {
                    http_user_agent: {
                      // New Logging - Kubernetes Ingress: Exclude requests from Statuscake
                      query: 'StatusCake',
                    },
                  },
                },
                {
                  match_phrase: {
                    http_user_agent: {
                      // New Logging - Kubernetes Ingress: Exclude requests from UptimeRobot
                      query: 'UptimeRobot',
                    },
                  },
                },
                {
                  match_phrase: {
                    request_user_agent: {
                      // New Logging - OpenShift Router: Exclude requests from Statuscake
                      query: 'StatusCake',
                    },
                  },
                },
                {
                  match_phrase: {
                    request_user_agent: {
                      // New Logging - OpenShift Router: Exclude requests from UptimeRobot
                      query: 'UptimeRobot',
                    },
                  },
                },
                {
                  match_phrase: {
                    request_uri: {
                      // New Logging - Kubernetes Ingress: Exclude requests to acme challenges
                      query: 'acme-challenge',
                    },
                  },
                },
                {
                  match_phrase: {
                    http_request: {
                      // New Logging - OpenShift Router: Exclude requests to acme challenges
                      query: 'acme-challenge',
                    },
                  },
                },
              ],
            },
          },
          aggs: {
            hourly: {
              date_histogram: {
                field: '@timestamp',
                fixed_interval: '1h',
                min_doc_count: 0,
                extended_bounds: {
                  min: interestedDateBeginString,
                  max: interestedDateEndString,
                },
              },
              aggs: {
                count: {
                  value_count: {
                    field: '@timestamp',
                  },
                },
              },
            },
            average: {
              avg_bucket: {
                buckets_path: 'hourly>count',
                gap_policy: 'skip', // makes sure that we don't use empty buckets as average calculation
              },
            },
          },
        },
      };
      const newResult = await esClient.search(newQuery);

      return { newResult, legacyResult };
    } catch (e) {
      logger.error(
        `Elastic Search Query Error: ${
          JSON.stringify(e) != '{}' ? JSON.stringify(e) : e
        }`,
      );
      // const noHits = { total: 0 };

      // if(e.body === "Open Distro Security not initialized."){
      //   return noHits;
      // }

      // if (e.body && e.body.error && e.body.error.type && (e.body.error.type === 'index_not_found_exception' || e.body.error.type === 'security_exception')) {
      //   return noHits;
      // }

      return { newResult: null, legacyResult: null };

      throw e;
    }
  };

  const calculateHitsFromESData = (legacyResult, newResult) => {
    // 0 hits found in elasticsearch, don't even try to generate monthly counts
    if (
      legacyResult.hits.total.value === 0 &&
      newResult.hits.total.value === 0
    ) {
      return { total: 0 };
    }

    var total = 0;

    const legacyBuckets =
      legacyResult &&
      legacyResult.aggregations &&
      legacyResult.aggregations.hourly &&
      legacyResult.aggregations.hourly.buckets
        ? legacyResult.aggregations.hourly.buckets
        : 0;
    const legacyResultCount =
      legacyResult &&
      legacyResult.aggregations &&
      legacyResult.aggregations.hourly &&
      legacyResult.aggregations.hourly.buckets &&
      legacyResult.aggregations.hourly.buckets.length
        ? legacyResult.aggregations.hourly.buckets.length
        : 0;
    const legacyAvg =
      legacyResult &&
      legacyResult.aggregations &&
      legacyResult.aggregations.average &&
      legacyResult.aggregations.average.value
        ? parseInt(legacyResult.aggregations.average.value)
        : 0;

    const newBuckets =
      newResult &&
      newResult.aggregations &&
      newResult.aggregations.hourly &&
      newResult.aggregations.hourly.buckets
        ? newResult.aggregations.hourly.buckets
        : 0;
    const newResultCount =
      newResult &&
      newResult.aggregations &&
      newResult.aggregations.hourly &&
      newResult.aggregations.hourly.buckets &&
      newResult.aggregations.hourly.buckets.length
        ? newResult.aggregations.hourly.buckets.length
        : 0;
    const newAvg =
      newResult &&
      newResult.aggregations &&
      newResult.aggregations.average &&
      newResult.aggregations.average.value
        ? parseInt(newResult.aggregations.average.value)
        : 0;

    /*
    foreach hourlybucket (#both result buckets should have the exact same amount of buckets)
    add to total
        if newResult.bucketcount is not 0 use newResult.bucketcount
        if legacyResult.bucketcount is not 0 use legacyResult.bucketcount
        if newResult.bucketcount is 0 and legacyResult.bucketcount is 0
          --> if newResult.average is not 0, use newResult.average
          --> if legacyResult.average is not 0, use legacyResult.average
          --> if both are 0, use newResult.average
    */

    const count = newResultCount > 0 ? newResultCount : legacyResultCount;
    for (let i = 0; i < count; i++) {
      if (
        newResultCount !== 0 &&
        newBuckets[i] &&
        newBuckets[i].count &&
        newBuckets[i].count.value !== 0
      ) {
        // We have new logging data, use this for total
        total += newBuckets[i].count.value;
      } else if (
        legacyResultCount !== 0 &&
        legacyBuckets[i] &&
        legacyBuckets[i].count &&
        legacyBuckets[i].count.value !== 0
      ) {
        // We have legacy data
        total += legacyBuckets[i].count.value;
      } else {
        // Both legacy and new logging buckets are zero, meaning we have missing data, use the avg
        if (newAvg !== 0 && newAvg > legacyAvg) {
          total += newAvg;
        } else if (legacyAvg !== 0) {
          total += legacyAvg;
        } else {
          total += newAvg;
        }
      }
    }

    return { total };
  };

  const environmentHitsMonthByEnvironmentId = async (
    project,
    openshiftProjectName,
    yearMonth,
  ) => {
    const interestedDate = yearMonth ? new Date(yearMonth) : new Date();
    const year = interestedDate.getUTCFullYear();
    const month = interestedDate.getUTCMonth() + 1; // internally months start with 0, we need them with 1

    // This generates YYYY-MM
    const interestedYearMonth = `${year}-${month < 10 ? `0${month}` : month}`;

    // generate a string of the date on the very first second of the month
    const interestedDateBeginString = interestedDate.toISOString();

    // generate a string of the date on the very last second of the month
    const interestedDateEnd = interestedDate;
    interestedDateEnd.setUTCMonth(interestedDate.getUTCMonth() + 1);
    interestedDateEnd.setUTCDate(0); // setting the date to 0 will select 1 day before the actual date
    interestedDateEnd.setUTCHours(23);
    interestedDateEnd.setUTCMinutes(59);
    interestedDateEnd.setUTCSeconds(59);
    interestedDateEnd.setUTCMilliseconds(999);
    const interestedDateEndString = interestedDateEnd.toISOString();

    const { newResult, legacyResult } = await fetchElasticSearchHitsData(
      project.toLocaleLowerCase().replace(/[^0-9a-z-]/g, '-'),
      openshiftProjectName,
      interestedYearMonth,
      interestedDateBeginString,
      interestedDateEndString,
    );

    if (newResult === null || legacyResult === null) {
      return { total: 0 };
    }

    const result = calculateHitsFromESData(legacyResult, newResult);

    return result;
  };

  return {
    projectEnvironments,
    environmentsByProjectId,
    environmentStorageMonthByEnvironmentId,
    environmentHoursMonthByEnvironmentId,
    environmentHitsMonthByEnvironmentId,
    calculateHitsFromESData,
  };
};
