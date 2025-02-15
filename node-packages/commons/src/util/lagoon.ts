import { getConfigFromEnv } from './config';
import { EnvKeyValue } from '../api';

export const generateBuildId = () =>
  `lagoon-build-${Math.random().toString(36).substring(7)}`;

export const generateTaskName = () =>
  `lagoon-task-${Math.random().toString(36).substring(7)}`;

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
