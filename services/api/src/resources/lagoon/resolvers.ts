import { getConfigFromEnv } from '../../util/config';
import { ResolverFn } from '../';

export const getLagoonVersion: ResolverFn = async () =>
  getConfigFromEnv('LAGOON_VERSION', 'unknown');
