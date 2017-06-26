// @flow

import type { Site, SiteGroupFile } from "./types";

type Cb<R> = (err?: Error, res: R) => void;

type Noop = { type: "NOOP" };

export type CreateSiteAction = {
  type: "CREATE_SITE",
  file: string,
  cb: Cb<Site>
};

export type UpdateFileAction = {
  type: "UPDATE_FILE",
  file: string,
  content: string
};

export type SetSiteGroupAction = {
  type: "SET_SITE_GROUPS",
  siteGroups: SiteGroupFile
};

export const setSiteGroups = (
  siteGroups: SiteGroupFile
): SetSiteGroupAction => ({ type: "SET_SITE_GROUPS", siteGroups });

export type Action = SetSiteGroupAction | Noop;

