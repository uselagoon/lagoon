import { getConfigFromEnv } from './config';
import { EnvKeyValue } from '../api';
import { randomInt } from 'crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

// can generate 1.7 × 10²⁰ possible names with 13 characters
const randomSuffix = (length = 13): string =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export const generateBuildId = () => `lagoon-build-${randomSuffix()}`;
export const generateVariableOnlyBuildId = () => `lagoon-variables-${randomSuffix()}`;
export const generateTaskName = () => `lagoon-task-${randomSuffix()}`;

// Find a URL in `process.env.LAGOON_ROUTES` or return a fallback.
export const getLagoonRouteFromEnv = (
  routeTest: RegExp,
  fallback: string,
): string => {
  const routes = getConfigFromEnv('LAGOON_ROUTES', '').split(',');
  const route = routes.find(route => routeTest.test(route));

  return route ?? fallback;
}

export const hasEnvVar = (
  envVars: Pick<EnvKeyValue, 'name'>[],
  name: string,
): boolean => {
  const found = envVars.find((envVar) => envVar.name === name);

  if (found !== undefined) {
    return true;
  }

  return false;
};

export const getEnvVarValue = (
  envVars: Pick<EnvKeyValue, 'name' | 'value'>[],
  name: string,
): string | undefined =>
  envVars.find((envVar) => envVar.name === name)?.value;
