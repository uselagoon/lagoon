import { getConfigFromEnv } from '../../util/config';
import { ResolverFn } from '../';
import { GetTypeEventMap } from '@lagoon/commons/dist/event-types';

export const getLagoonVersion: ResolverFn = async () =>
  getConfigFromEnv('LAGOON_VERSION', 'unknown');


export const getRegisteredLagoonEventTypes = async () => {
  const ret = [];
  const eventTypeMap = GetTypeEventMap().getEventsToTypes().entries();

  for (let[key, value] of eventTypeMap) {
     ret.push({name:key, types:value});
  }
  return ret;
}
