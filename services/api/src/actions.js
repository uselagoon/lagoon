// @flow

import type { Site, SiteGroupsFile, ClientsFile } from './types';

type Cb<R> = (err?: Error, res: R) => void;

type Noop = { type: 'NOOP' };

export type CreateSiteAction = { type: 'CREATE_SITE', file: string, cb: Cb<Site> };

export type UpdateFileAction = { type: 'UPDATE_FILE', file: string, content: string };

export type SetSiteGroupsAction = { type: 'SET_SITE_GROUPS', siteGroups: SiteGroupsFile };

export const setSiteGroups = (siteGroups: SiteGroupsFile): SetSiteGroupsAction => ({
  type: 'SET_SITE_GROUPS',
  siteGroups,
});

export type SetClientsAction = { type: 'SET_CLIENTS', clients: ClientsFile };

export const setClients = (clients: ClientsFile): SetClientsAction => ({
  type: 'SET_CLIENTS',
  clients,
});

export const setSiteFiles = siteFiles => ({ type: 'SET_SITE_FILES', siteFiles });

export type Action = SetSiteGroupsAction | SetClientsAction | Noop;
