// @flow

import {
  ApolloClient,
  IntrospectionFragmentMatcher,
  createNetworkInterface,
  createBatchingNetworkInterface,
} from 'apollo-client';
import {
  printRequest as doPrintRequest,
} from 'apollo-client/transport/networkInterface';
import { getQueryDocumentKey } from '@amazee/persistgraphql/lib/src/common';
import queryMap from 'queries.json';
import introspectionResult from 'introspection.json';

const printRequest = request => {
  if (!Object.hasOwnProperty.call(request, 'query')) {
    return request;
  }

  const printedRequest = doPrintRequest(request);
  return {
    ...printedRequest,
    query: printedRequest.query.replace(/\s{2,}/g, ' '),
  };
};

const addGetRequests = networkInterface => {
  function fetchOverride({ request, options }) {
    const uri = this._uri; // eslint-disable-line no-underscore-dangle
    const ownOptions = this._opts; // eslint-disable-line no-underscore-dangle

    // Combine all requests into an array and turn them into a GET query.
    const delimiter = uri.indexOf('?') === -1 ? '?' : '&';
    const printedRequest = printRequest(request);
    const query = Object.keys(printedRequest)
      .reduce(
        (carry, current) => [
          ...carry,
          [`${current}=${JSON.stringify(printedRequest[current])}`],
        ],
        [],
      )
      .join('&');

    return global.fetch(`${uri}${delimiter}${query}`, {
      ...ownOptions,
      ...options,
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  function batchedFetchOverride(requestsAndOptions) {
    const uri = this._uri; // eslint-disable-line no-underscore-dangle
    const ownOptions = this._opts; // eslint-disable-line no-underscore-dangle

    // Combine all requests into an array and turn them into a GET query.
    const delimiter = uri.indexOf('?') === -1 ? '?' : '&';
    const options = requestsAndOptions.options;
    const query = requestsAndOptions.requests
      .map(printRequest)
      .reduce(
        (carry, current, index) => [
          ...carry,
          [`${index}=${JSON.stringify(current)}`],
        ],
        [],
      )
      .join('&');

    return global.fetch(`${uri}${delimiter}${query}`, {
      ...ownOptions,
      ...options,
      headers: {
        Accept: '*/*',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  return Object.assign(networkInterface, {
    fetchFromRemoteEndpoint: fetchOverride.bind(networkInterface),
    batchedFetchFromRemoteEndpoint: batchedFetchOverride.bind(networkInterface),
  });
};

const addPersistedQueries = (apiVersion: string, networkInterface: any) => {
  const doQuery = networkInterface.query.bind(networkInterface);

  function queryOverride(request) {
    const queryDocument = request.query;
    const queryKey = getQueryDocumentKey(queryDocument);

    if (!queryMap[queryKey]) {
      return Promise.reject(
        new Error('Could not find query inside query map.'),
      );
    }

    const serverRequest = {
      version: apiVersion,
      id: queryMap[queryKey],
      variables: request.variables,
      operationName: request.operationName,
    };

    return doQuery(serverRequest);
  }

  return Object.assign(networkInterface, {
    query: queryOverride.bind(networkInterface),
  });
};

const configureApolloClient = (apiUri: string, apiVersion: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasApiVersion = !!apiVersion;

  // Use xdebug in development.
  const requestUri = isProduction
    ? apiUri
    : `${apiUri}?XDEBUG_SESSION_START=PHPSTORM`;

  // Use batched queries in production.
  const networkInterface = isProduction
    ? createBatchingNetworkInterface({
        uri: requestUri,
        batchInterval: 100,
      })
    : createNetworkInterface({
        uri: requestUri,
      });

  // Use persisted queries and GET requests in production.
  const finalNetworkInterface = isProduction && hasApiVersion
    ? addGetRequests(addPersistedQueries(apiVersion, networkInterface))
    : networkInterface;

  const apolloClient = new ApolloClient({
    reduxRootSelector: state => state.apollo,
    networkInterface: finalNetworkInterface,
    ssrMode: __SERVER__,
    fragmentMatcher: new IntrospectionFragmentMatcher({
      introspectionQueryResultData: introspectionResult,
    }),
  });

  return apolloClient;
};

export default configureApolloClient;
