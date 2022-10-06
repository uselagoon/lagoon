import { prop, propOr } from 'ramda';
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
