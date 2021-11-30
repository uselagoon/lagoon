import { getConfigFromEnv } from '../../util/config';
import { ResolverFn } from '../';
import { GetTypeEventMap } from '@lagoon/commons/dist/event-types'

export const getLagoonVersion: ResolverFn = async () =>
  getConfigFromEnv('LAGOON_VERSION', 'unknown');


export const getRegisteredLagoonEventTypes = async () => {
  const ret = [];
  console.log(GetTypeEventMap());
  console.log("here");
  for (let[key, value] of GetTypeEventMap()) {
    ret.push({name:key, type:value});
  }
  return ret;
}