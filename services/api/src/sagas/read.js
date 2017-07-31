// @flow
const { put } = require('redux-saga/effects');

import type { IOEffect } from 'redux-saga/effects';

function* readSaga(): Generator<IOEffect, *, *> {
  yield put({ type: 'readSaga' });
}

module.exports = readSaga;
