// @flow

const { syncSaga } = require('./sync');
const { fork } = require('redux-saga/effects');

import type { IOEffect } from 'redux-saga/effects';

import type { SyncSagaArgs } from './sync';

export type RootSagaArgs = SyncSagaArgs & {};

function* rootSaga(args: RootSagaArgs): Generator<IOEffect, *, *> {
  yield fork(syncSaga, args);
}

module.exports = rootSaga;
