// @flow

// ===== ACTION TYPES

import type { Site, SiteGroupsFile, ClientsFile, SiteFiles } from './types';

type Cb<R> = (err?: Error, res: R) => void;

type Noop = { type: 'NOOP' };

export type SetSiteFilesAction = {
  type: 'SET_SITE_FILES',
  siteFiles: SiteFiles,
};

export type CreateSiteAction = {
  type: 'CREATE_SITE',
  file: string,
  cb: Cb<Site>,
};

export type UpdateFileAction = {
  type: 'UPDATE_FILE',
  file: string,
  content: string,
};

export type SetSiteGroupsFileAction = {
  type: 'SET_SITE_GROUPS_FILE',
  siteGroupsFile: SiteGroupsFile,
};

export type SetClientsFileAction = {
  type: 'SET_CLIENTS_FILE',
  clientsFile: ClientsFile,
};

export type Action =
  | SetSiteFilesAction
  | SetSiteGroupsFileAction
  | SetClientsFileAction
  | Noop;

// ===== ACTION CREATORS

const setSiteGroupsFile = (
  siteGroupsFile: SiteGroupsFile,
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

module.exports = {
  setSiteGroupsFile,
  setClientsFile,
  setSiteFiles,
};
