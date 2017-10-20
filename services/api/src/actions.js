// @flow

// ===== ACTION TYPES

import type {
  Site,
  SiteGroup,
  SiteGroupsFile,
  ClientsFile,
  SiteFiles,
} from './types';

type Cb<R> = (err?: Error, res: R) => void;

type Noop = { type: 'NOOP' };

export type CreateSiteGroupAction = {
  type: 'CREATE_SITEGROUP',
  siteGroup: SiteGroup,
};

export type SetSiteFilesAction = {
  type: 'SET_SITE_FILES',
  siteFiles: SiteFiles,
};

export type SetSiteGroupsFileAction = {
  type: 'SET_SITE_GROUPS_FILE',
  siteGroupsFile: SiteGroupsFile,
};

export type SetClientsFileAction = {
  type: 'SET_CLIENTS_FILE',
  clientsFile: ClientsFile,
};

// export type PushActionQueueAction = {
//   type: 'PUSH_ACTION_QUEUE',
//   action: Action,
// };

export type Action =
  | CreateSiteGroupAction
  // | PushActionQueueAction
  | SetSiteFilesAction
  | SetSiteGroupsFileAction
  | SetClientsFileAction
  | Noop;

// ===== ACTION CREATORS

const createSiteGroup = (siteGroup: SiteGroup) => ({
  type: 'CREATE_SITEGROUP',
  siteGroup,
});

const setSiteGroupsFile = (
  siteGroupsFile: SiteGroupsFile
): SetSiteGroupsFileAction => ({
  type: 'SET_SITE_GROUPS_FILE',
  siteGroupsFile,
});

const setClientsFile = (clientsFile: ClientsFile): SetClientsFileAction => ({
  type: 'SET_CLIENTS_FILE',
  clientsFile,
});

const setSiteFiles = (siteFiles: SiteFiles): SetSiteFilesAction => ({
  type: 'SET_SITE_FILES',
  siteFiles,
});

// const pushActionQueue = (action: Action): PushActionQueueAction => ({
//   type: 'PUSH_ACTION_QUEUE',
//   action,
// });

module.exports = {
  setSiteGroupsFile,
  setClientsFile,
  setSiteFiles,
  createSiteGroup,
  // pushActionQueue,
};
