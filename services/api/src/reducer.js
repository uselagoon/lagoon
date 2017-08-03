// @flow

import type { Action } from './actions';
import type { SiteGroupsFile, ClientsFile, SiteFiles } from './types';

export type State = {
  siteGroupsFile?: SiteGroupsFile,
  clientsFile?: ClientsFile,
  siteFiles?: SiteFiles,
};

const reducer = (state: State = {}, action: Action): State => {
  switch (action.type) {
    case 'SET_SITE_GROUPS_FILE': {
      const { siteGroupsFile } = action;
      return Object.assign({}, state, { siteGroupsFile });
    }
    case 'SET_SITE_FILES': {
      const { siteFiles } = action;
      return Object.assign({}, state, { siteFiles });
    }
    case 'SET_CLIENTS_FILE': {
      const { clientsFile } = action;
      return Object.assign({}, state, { clientsFile });
    }
    default:
      return state;
  }
};

module.exports = reducer;
