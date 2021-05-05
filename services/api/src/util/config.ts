import { propOr } from 'ramda';

export const getConfigOr = (
  data: any,
  name: string,
  fallback: string
): string => propOr(fallback, name, data);

export const getConfigFromEnv = (name: string, fallback: string): string =>
  getConfigOr(process.env, name, fallback);
