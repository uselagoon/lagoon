// @flow

import type { Action } from './actions';
import type { SiteGroupsFile, ClientsFile, Site } from './types';

export type State = {
  siteGroups?: SiteGroupsFile,
  clients?: ClientsFile,
  sites?: Array<Site>,
};

const reducer = (state: State = {}, action: Action): State => {
  switch (action.type) {
    case 'SET_SITE_GROUPS': {
      const { siteGroups } = action;
      return { ...state, siteGroups };
    }
    case 'SET_CLIENTS': {
      const { clients } = action;
      return { ...state, clients };
    }
    case 'SET_SITES': {
      const { sites } = action;
      return { ...state, sites };
    }
    default:
      return state;
  }
};

module.exports = reducer;
