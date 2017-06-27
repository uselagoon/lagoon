// @flow

import type { Action } from "./actions";
import type { SiteGroupFile } from "./types";

export type State = { siteGroups?: SiteGroupFile };

const reducer = (state: State = {}, action: Action): State => {
  switch (action.type) {
    case "SET_SITE_GROUPS": {
      const { siteGroups } = action;
      return { siteGroups };
    }
    default:
      return state;
  }
};

module.exports = reducer; 


