// @flow

import type { Site } from './types';

type Cb<R> = (err?: Error, res: R) => void;

type Noop = { type: 'NOOP' };
export type Actions = Noop;

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
