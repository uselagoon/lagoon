// @flow

import React from 'react';
import Helmet from 'react-helmet';
import { match, createMemoryHistory, RouterContext } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import { ServerStyleSheet } from 'styled-components';
// $FlowIssue: Type definitions are incorrect for this one.
import { ApolloProvider, renderToStringWithData } from 'react-apollo/lib';
import {
  AsyncComponentProvider,
  createAsyncContext,
} from 'react-async-component';
import asyncBootstrapper from 'react-async-bootstrapper';
import serialize from 'serialize-javascript';
import configureApolloClient from 'state/configureApolloClient';
import { selectLocationState } from 'state/selectors/route';
import configureServerStore from 'state/configureServerStore';
import createRoutes from 'routing/createRoutes';
import logger from 'logger';

const renderWithoutSsr = (
  env: Object,
  req: Object,
  res: Object,
  next: Function,
): void => {
  const apiUri: string = JSON.stringify(env.API);
  const apiVersion: string =
    (env.API_VERSION && JSON.stringify(env.API_VERSION)) || '';
  const initialState: string = JSON.stringify({});

  // Let the client render the site (e.g. when debugging).
  res.render('template', {
    apiUri,
    apiVersion,
    initialState,
    renderedContent: '',
    htmlAttributes: '',
    htmlHead: '',
  });

  next();
};

const doRenderWithSrr = (
  reduxStore: Object,
  apolloClient: Object,
  asyncContext: Object,
  styleSheet: Object,
) => (env: Object, req: Object, res: Object, next: Function): void => (
  renderedContent: string,
) => {
  // Stop profiling of the react rendering with apollo.
  logger.profile('Rendering with data dependencies');

  // The order in which the html head elements should be rendered.
  const headOrder: Array<string> = [
    'title',
    'base',
    'meta',
    'link',
    'script',
    'style',
  ];

  // Render the html as a string and collect side-effects afterwards.
  const apiUri: string = JSON.stringify(env.API);
  const apiVersion: string =
    (env.API_VERSION && JSON.stringify(env.API_VERSION)) || '';

  const asyncState = serialize(asyncContext.getState());

  const renderedCss: string = styleSheet
    .getStyleTags()
    .replace(/(?:\r\n|\r|\n)/g, '');
  const helmetOutput: Object = Helmet.renderStatic();
  const htmlAttributes: string = helmetOutput.htmlAttributes.toString();
  const htmlHead: string = headOrder
    .map((key: string): string => helmetOutput[key].toString().trim())
    .join('');

  // Start profiling of the initial state extraction.
  logger.profile('Extracting initial state');

  const initialState: string = serialize({
    ...reduxStore.getState(),
    apollo: apolloClient.getInitialState(),
  });

  // Stop profiling of the initial state extraction.
  logger.profile('Extracting initial state');

  // Render the app with the pre-compiled template.
  res.render(
    'template',
    {
      apiUri,
      apiVersion,
      renderedContent,
      renderedCss,
      asyncState,
      initialState,
      htmlHead,
      htmlAttributes,
    },
    (err, html) => {
      res.send(html);
      res.end();

      next();
    },
  );
};

const renderWithSsr = (
  env: Object,
  req: Object,
  res: Object,
  next: Function,
): void => {
  // Configure the apollo client with persisted queries.
  const apolloClient: any = configureApolloClient(env.API, env.API_VERSION);

  // Set the current path (req.path) as initial history entry due to this bug:
  // https://github.com/reactjs/react-router-redux/issues/284#issuecomment-184979791
  const memoryHistory: any = createMemoryHistory(req.path);
  const reduxStore: AmazeeStore<any, any> = configureServerStore(
    apolloClient,
    memoryHistory,
    req,
  );

  const routes: any = createRoutes(reduxStore);

  // Sync history and store, as the react-router-redux reducer is under the
  // non-default key ("routing"), selectLocationState must be provided for
  // resolving how to retrieve the "route" in the state
  syncHistoryWithStore(memoryHistory, reduxStore, { selectLocationState });

  /*
   * From the react-router docs:
   *
   * This function is to be used for server-side rendering. It matches a set of routes to
   * a location, without rendering, and calls a callback(error, redirectLocation, renderProps)
   * when it's done.
   *
   * The function will create a `history` for you, passing additional `options` to create it.
   * These options can include `basename` to control the base name for URLs, as well as the pair
   * of `parseQueryString` and `stringifyQuery` to control query string parsing and serializing.
   * You can also pass in an already instantiated `history` object, which can be constructured
   * however you like.
   *
   * The three arguments to the callback function you pass to `match` are:
   * - error: A javascript Error object if an error occured, `undefined`
   *   otherwise.
   * - redirectLocation: A `Location` object if the route is a redirect,
   *  `undefined` otherwise
   * - renderProps: The props you should pass to the routing context if the
   *   route matched, `undefined` otherwise.
   *
   * If all three parameters are `undefined`, this means that there was no route
   * found matching the given location.
   */
  match(
    {
      routes,
      location: req.originalUrl,
    },
    (error: any, redirectLocation: Object, renderProps: Object): void => {
      if (error) {
        next(error);
      } else if (redirectLocation) {
        res.redirect(302, redirectLocation.pathname + redirectLocation.search);
        next();
      } else if (renderProps) {
        const asyncContext = createAsyncContext();
        const styleSheet = new ServerStyleSheet();

        const Root: React.Element<any> = styleSheet.collectStyles(
          <AsyncComponentProvider asyncContext={asyncContext}>
            <ApolloProvider store={reduxStore} client={apolloClient}>
              <RouterContext {...renderProps} />
            </ApolloProvider>
          </AsyncComponentProvider>,
        );

        // Start profiling of the react rendering with apollo.
        logger.profile('Rendering with data dependencies');

        // Renders the app component tree into a string.
        const renderAppToString = () => renderToStringWithData(Root);

        // Needs to be repeated in case of nested async components
        // with apollo data dependencies.
        const repeatAsyncBootstrap = () => asyncBootstrapper(Root);

        // Renders the application with asynchronous components.
        const renderInTemplate = doRenderWithSrr(
          reduxStore,
          apolloClient,
          asyncContext,
          styleSheet,
        )(env, req, res, next);

        // TODO: Rendering twice is not ideal but currently the only
        // way to resolve nested asynchronous components and their
        // data dependencies.
        asyncBootstrapper(Root)
          .then(renderAppToString)
          .then(repeatAsyncBootstrap)
          .then(renderAppToString)
          .then(renderInTemplate);
      } else {
        res.status(404).send('Page not found');
        next();
      }
    },
  );
};

// Express route for server side rendering.
export default (
  env: Object,
  req: Object,
  res: Object,
  next: Function,
): void => {
  const ssrDisabled = !!(env.SSR_DISABLED && JSON.parse(env.SSR_DISABLED));

  if (ssrDisabled) {
    renderWithoutSsr(env, req, res, next);
  } else {
    renderWithSsr(env, req, res, next);
  }
};
