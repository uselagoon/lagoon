// @flow

import { takeEvery } from 'redux-saga';

function* startTransaction(storage: Storage): Generator<*, *, *> {
}

function* queueSaga(storage: Storage): Generator<*, *, *> {
  yield takeEvery('asdf', startTransaction);
}

export default queueSaga;
