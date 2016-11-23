// @flow

/* eslint-disable no-console */

import { chan, go, put, putAsync, take, CLOSED } from 'js-csp';
import { type, compose } from 'ramda';
import runGQLQuery from './query';

import typeof { Channel } from 'js-csp/es/impl/channels';
import typeof { PutInstruction } from 'js-csp/es/impl/instruction';

type StdoutEffect = {
  type: 'stdout',
  data: any,
};

type StderrEffect = {
  type: 'stderr',
  data: any,
}

type GQLEffect = {
  type: 'gql',
  query: string,
  variables: Object,
};

type StateEffect = {
  type: 'state',
  code: number,
};

type CallFn = () => Channel | Generator<*, Channel, *>;
type CallEffect = {
  type: 'call',
  fn: CallFn,
  args?: any[], 
};

type Effect =
  StdoutEffect
  | CallEffect
  | StderrEffect
  | GQLEffect
  | StateEffect;

export const stdoutEffect = (data: any): StdoutEffect => ({
  type: 'stdout',
  data,
});

export const stderrEffect = (data: any): StderrEffect => ({
  type: 'stderr',
  data,
});

export const gqlEffect = (query: string, variables: Object): GQLEffect => ({
  type: 'gql',
  query,
  variables,
});

export const callEffect = (fn: CallFn, ...args: any[]): CallEffect => ({
  type: 'call',
  fn,
  args,
});

export const stateEffect = (code: number = 0): StateEffect => ({
  type: 'state',
  code,
});

type EffectFn = (...args: any[]) => Effect;
type PutFn = (...args: any[]) => PutInstruction;

export const connectPut = (ch: Channel, effectFn: EffectFn): PutFn => (...args) => put(ch, effectFn(...args));

const logToConsole = (target: 'log' | 'error', data: mixed): void => {
  const write = console[target];
  if (type(data) === 'Object') {
    write(JSON.stringify(data, null, 2));
  }
  else {
    write(data);
  }
};

export type EffectHandlerArgs = {
  input: Channel,
  out: Channel,
};

export function* effectHandler(args: EffectHandlerArgs): Generator<*, *, Effect> {
  const {
    input,
    out,
  } = args;

  let effect;
  while ((effect = yield take(input)) !== CLOSED) {
    switch (effect.type) {
      case 'stdout': {
        const { data } = effect;
        logToConsole('log', data);
        break;
      }
      case 'stderr': {
        const { data } = effect;
        logToConsole('error', data);
        break;
      }
      case 'call': {
        const { fn, args = [] } = effect;

        const result = yield fn(...args);
        yield put(out, result);

        break;
      }
      case 'state': {
        const { code } = effect;
        yield put(out, { code });
      }
    }
  }
}

