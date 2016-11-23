// @noflow 

import { take, put, go, chan, takeAsync, spawn } from 'js-csp'; // eslint-disable-line
import { contains } from 'ramda';
import gql from '../gql';


import {
  stdoutEffect,
  stderrEffect,
  gqlEffect,
  stateEffect,
  connectPut,
  effectHandler,
} from '../effects';

import type { EffectHandlerArgs } from '../effects';
import typeof { Channel } from 'js-csp/es/impl/channels';
import typeof RunGQLQueryFn from '../query';

type ListSitesArgs = {
  input: Channel,
  out: Channel,
};

export function* listSites(args: ListSitesArgs): Generator<*, *, *> {
}

type CliRoutineArgs = EffectHandlerArgs & {
  routine: Generator<*, *, *>,
};

export function* runRoutine(args: CliRoutineArgs) {
  const { routine } = args;

  go(effectHandler, [args]);
  return go(routine, [args]);
}

type ListArgs = {
  input: Channel,
  out: Channel,
  chan: Channel,
  sitegroup: string,
  target: 'sites',
};

export default function* list(args: ListArgs): Generator<*, *, *> {
  const {
    input,
    out,
    sitegroup,
    target,
    runGQLQueryFn,
  } = args;

  const log = connectPut(input, stdoutEffect);
  const logErr = connectPut(input, stderrEffect);
  const gqlQuery = connectPut(input, gqlEffect);
  const getState = connectPut(input, stateEffect);

  const end = (code) => go(function* (){
    yield put(input, stateEffect(code));
    const state = yield take(out);

    input.close();
    out.close();

    return state;
  });

  if (!contains(target, ['sites'])) {
    yield logErr(`Unknown target '${target}'`);
    return end(1);
  }

  const query = gql`query myQuery($sitegroup: String!) {
    siteGroupByName(name: $sitegroup) {
      gitUrl
      sites(first: 1000) {
        edges {
          node {
            siteName
            siteBranch
            siteEnvironment
            siteHost
            serverInfrastructure
            serverIdentifier
            serverNames
          }
        }
      }
    }
  }`;

  yield gqlQuery(query, { sitegroup });
  const result = yield take(out);

  yield log(result);

  yield getState(0);
  const { code } = yield take(out);

  yield log(`State code: ${code}`);
  yield log(stack);

  return end(0);
}
