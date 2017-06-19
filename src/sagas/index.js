// @flow

import { syncSaga } from './sync';
import { fork } from 'redux-saga/effects';
import type { IOEffect } from 'redux-saga/effects';

import type { SyncSagaArgs } from './sync';

export type RootSagaArgs = SyncSagaArgs & {};

export default function* rootSaga(args: RootSagaArgs): Generator<IOEffect, *, *> {
  yield fork(syncSaga, args);
}
