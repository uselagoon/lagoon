// @flow
import { put } from 'redux-saga/effects';
import type { IOEffect } from 'redux-saga/effects';

export function* readSaga(): Generator<IOEffect, *, *> {
  yield put({ type: 'w00t' });
}
