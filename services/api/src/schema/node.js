/* eslint-disable global-require */

import {
  fromGlobalId,
  nodeDefinitions,
} from 'graphql-relay';

import Site, { getSiteById } from './models/site';
import SiteGroup, { getSiteGroupById } from './models/sitegroup';
import Client, { getClientById } from './models/client';

export const { nodeInterface, nodeField } = nodeDefinitions(
  (globalId) => {
    const { type, id } = fromGlobalId(globalId);

    if (type === 'Site') {
      return getSiteById(id);
    }

    if (type === 'SiteGroup') {
      return getSiteGroupById(id);
    }

    if (type === 'Client') {
      return getClientById(id);
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
  }
);
