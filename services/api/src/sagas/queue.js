
import { takeEvery } from 'redux-saga';

function* startTransaction(storage: Storage): Generator<*, *, *> {
  // eslint-disable-next-line no-console
  console.log(storage);
  yield 'asdf';
}

function* queueSaga(storage: Storage): Generator<*, *, *> {
  // eslint-disable-next-line no-console
  yield takeEvery('asdf', startTransaction);
}

export default queueSaga;
