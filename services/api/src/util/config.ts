import { compose, prop, propOr, split, find, test, defaultTo } from 'ramda';
import { isNotNil } from './func';

export const getConfigOr = (
  data: any,
  name: string,
  fallback: string
): string => propOr(fallback, name, data);

export const getConfigFromEnv = (name: string, fallback: string = ''): string =>
  getConfigOr(process.env, name, fallback);

export const envHasConfig = (name: string): boolean =>
  isNotNil(prop(name, process.env));

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
