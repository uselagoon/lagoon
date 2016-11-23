// @flow

import {
  effectHandler,
  stdoutEffect,
  gqlEffect,
  callEffect,
} from '../effects';

import { go, chan, takeAsync, putAsync, put, take } from 'js-csp';
import { fromColl } from 'js-csp/lib/csp.operations';
import { resolveChannel } from '../util/csp';

describe('effectHandler', () => {
  it('should handle stdout / gqlQuery effects', (done) => {
    const input = chan();
    const out = chan();

    const runGQLQueryFn = () => fromColl([{ data: 'result' }]);
    const handler = go(effectHandler, [{
      input,
      out,
      runGQLQueryFn, 
      trackStack: true,
    }]);

    const ql = (...args) => go(function* () {
      yield put(input, callEffect(runGQLQueryFn, ...args));
      return yield take(out);
    });

    // Some routine interacting with the effectHandler
    go(function* () {
      // In generators, expect() errors will kill the jest
      // process, because the context is isolated for error propagation
      try {
        // yield call(runGQLQueryFn, { query: 'test' });
        // const result = yield take(out);
        const result = yield ql({ query: 'test' });

        expect(result).toEqual({ data: 'result' });

        input.close();
        out.close();
      } catch(e) {
        done.fail(e);
      }
      done();
    });
  });
});
