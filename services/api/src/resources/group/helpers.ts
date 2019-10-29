import {
  getEnvironmentsByProjectId as getEnvironments,
  getEnvironmentStorageMonthByEnvironmentId as getStorage,
  getEnvironmentHoursMonthByEnvironmentId as getHours,
  getEnvironmentHitsMonthByEnvironmentId as getHits,
} from '../environment/resolvers';

import { calculateProjectEnvironmentsTotalsToBill } from '../billing/billingCalculations';

export const filterBy = filterKey => ({ availability }) =>
  availability === filterKey;

// Needed for local Dev - Required if not connected to openshift
export const errorCatcherFn = (msg, responseObj) => err => {
  console.log(`${msg}: ${err.status} : ${err.message}`);
  return { ...responseObj };
};

// TODO: This can be unit tested with mock data easily.
// TODO: Add Comments
export const getProjectData = projectWithEnvironmentData => {
  const { id, availability, environments, name } = projectWithEnvironmentData;
  const projectData = calculateProjectEnvironmentsTotalsToBill(environments);
  return { id, name, availability, ...projectData, environments };
};

/**
 * Generates a function that gets billing data from an environment.
 *
 * @param {string} month The billing month we want to get data for.
 * @param {ExpressContext} ctx this includes the context passed from
 *     the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {Function} A function that takes an environment and returns billing data
 */
export const getEnvironmentData = (month, ctx) => async environment => {
  const { id, name, openshiftProjectName, environmentType } = environment;

  const hits = await getHits({ openshiftProjectName }, { month }, ctx).catch(
    errorCatcherFn('getHits', { total: 0 }),
  );

  const storage = await getStorage({ id }, { month }, ctx).catch(
    errorCatcherFn('getStorage', { bytesUsed: 0 }),
  );
  const hours = await getHours({ id }, { month }, ctx).catch(
    errorCatcherFn('getHours', { hours: 0 }),
  );

  return { id, name, type: environmentType, hits, storage, hours };
};

/**
 * Generates a function that gets all environments for a project.
 *
 * @param {string} month The billing month we want to get data for.
 * @param {ExpressContext} ctx the context passed from the apolloServer query
 *     { sqlClient, hasPermissions, keycloakGrant, requestCache }
 *
 * @return {Function} A function that takes a project and returns all environments
 *    including all Environment Billing Data
 */
export const getProjectEnvironments = (month, context) => async project => {
  const pid = { id: project.id };
  const gArgs = { includeDeleted: true };
  const rawEnvs = await getEnvironments(pid, gArgs, context);
  const environments = await Promise.all(
    rawEnvs.map(getEnvironmentData(month, context)),
  );
  return { ...project, environments };
};

export const getYearMonthFromString = yearMonth => {
  const splits = yearMonth.split('-');
  return {
    month: splits[1],
    year: splits[0],
  };
};
