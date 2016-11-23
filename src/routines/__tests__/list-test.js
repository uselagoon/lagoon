// @flow

import { path } from 'ramda';
import { chan, takeAsync, go, put, take } from 'js-csp';
import { resolveChannel } from '../../util/csp';
import list from '../list';

import typeof { Channel } from 'js-csp/es/impl/channels';

const getEffect = (ret) => path(['value', 'value'], ret);
const getChannel = (ret) => path(['value', 'channel'], ret);

describe('list', () => {
  it('should list all sites of given sitegroup', () => {
    const input = chan();
    const out = chan();

    const iter = list({
      input,
      out,
      sitegroup: 'amazee_io',
      target: 'sites',
    });

    let ret = iter.next();

    // Asks for a graphQL result
    expect(getChannel(ret)).toEqual(input);
    expect(getEffect(ret).type).toEqual('gql');
    expect(getEffect(ret).query).toMatchSnapshot();
    expect(getEffect(ret).variables).toEqual({
      sitegroup: 'amazee_io',
    });

    // Retrieve the graphQL result
    ret = iter.next();
    expect(getChannel(ret)).toEqual(out);

    // Output the query result to stdout
    ret = iter.next();
    expect(getChannel(ret)).toEqual(input);
    expect(getEffect(ret).type).toEqual('stdout');

    // Retrieve the state and return the result code
    ret = iter.next();
  });

  it.skip('should list all sites of given sitegroup', () => {
    const input = chan();
    const out = chan();
    const runGQLQueryFn = jest.fn(() => ({
      some: 'data',
    }));

    const args = {
      input,
      out,
      sitegroup: 'amazee_io',
      target: 'sites',
      runGQLQueryFn,
    };

    const routine = go(list, [args]);

    return resolveChannel(routine).then(code => {
      expect(code).toEqual(0);
    });
  });

  it.skip('should error out on unknown target', () => {
    const input = chan();
    const out = chan();
    const runGQLQueryFn = jest.fn(() => ({
      some: 'data',
    }));

    const args = {
      input,
      out,
      sitegroup: 'amazee_io',
      target: 'unknown',
      runGQLQueryFn,
    };

    const routine = go(list, [args]);

  });
});
