// @flow

const R = require('ramda');

import type { Action } from './actions';
import type { SiteGroupsFile, ClientsFile, SiteFiles } from './types';

export type State = {
  siteGroupsFile?: SiteGroupsFile,
  clientsFile?: ClientsFile,
  siteFiles?: SiteFiles,

  // Responsible for deferred action manipulation - needs to be FIFO
  // actionQueue: Array<Action>,
};

const INITIAL_STATE = {
  // actionQueue: [],
};

const reducer = (state: State = INITIAL_STATE, action: Action): State => {
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
    case 'CREATE_SITE_GROUP': {
    }
    // case 'PUSH_ACTION_QUEUE': {
    //   return R.assoc('actionQueue', R.append(action.action), state);
    // }
    default:
      return state;
  }
};

module.exports = reducer;
