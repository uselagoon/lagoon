/* eslint-disable global-require */

import {
  fromGlobalId,
  nodeDefinitions,
} from 'graphql-relay';

import Site, { getSiteByName } from './models/site';
import SiteGroup, { getSiteGroupByName } from './models/sitegroup';
import Client, { getClientByName } from './models/client';

export const { nodeInterface, nodeField } = nodeDefinitions(
  (globalId) => {
    const { type, id } = fromGlobalId(globalId);

    if (type === 'Site') {
      return getSiteByName(id);
    }

    if (type === 'SiteGroup') {
      return getSiteGroupByName(id);
    }

    if (type === 'Client') {
      return getClientByName(id);
    }

    return null;
  },
  (object) => {
    if (object instanceof Site) {
      return require('./types/site').default;
    }

    if (object instanceof SiteGroup) {
      return require('./types/sitegroup').default;
    }

    if (object instanceof Client) {
      return require('./types/client').default;
    }

    return null;
  },
);
