import { compose, defaultTo, find, test, split } from 'ramda';
import { getConfigFromEnv } from './config';

export const generateBuildId = function() {
  return `lagoon-build-${Math.random().toString(36).substring(7)}`;
};

export const generateTaskName = function() {
  return `lagoon-task-${Math.random().toString(36).substring(7)}`;
};

/**
 * Find a URL in `process.env.LAGOON_ROUTES` or return a fallback.
 */
 export const getLagoonRouteFromEnv = (
  routeTest: RegExp,
  fallback: string
): string =>
  compose(
    defaultTo(fallback),
    find(test(routeTest)),
    split(',')
  )(getConfigFromEnv('LAGOON_ROUTES')) as string;
