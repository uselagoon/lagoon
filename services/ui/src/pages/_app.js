import 'isomorphic-unfetch';
import App, { createUrl } from 'next/app';
import React from 'react';
import Router from 'next/router';
import NProgress from 'nprogress';
// import '../static/nprogress.css';
import Head from 'next/head';
import getConfig from 'next/config';
import Typekit from 'react-typekit';
import Favicon from 'components/Favicon';
import Authenticator, { AuthContext } from 'lib/Authenticator';
import ApiConnection from 'lib/ApiConnection';


import 'components/Honeycomb/styling.css';
import '../admin/overrides.css';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

Router.events.on('routeChangeStart', () => NProgress.start()); Router.events.on('routeChangeComplete', () => NProgress.done()); Router.events.on('routeChangeError', () => NProgress.done());

class MyApp extends App {
  render() {
    const { router, Component, pageProps, err } = this.props;
    const url = createUrl(router);

    // Catch runtime errors in production and skip authentication to avoid
    // infinite auth > error > auth > error loops.
    if (err) {
      return (
        <>
          <Head>
            <link rel="stylesheet" href="/static/normalize.css" />
            <Typekit kitId="ggo2pml" />
          </Head>
          <Component {...pageProps} errorMessage={err.toString()} url={url} />
          <Favicon />
        </>
      );
    }

    return (
      <>
        <Head>
          <link rel="stylesheet" href="/static/normalize.css" />
          <Typekit kitId="ggo2pml" />
          <script
            type="text/javascript"
            src={`${publicRuntimeConfig.KEYCLOAK_API}/js/keycloak.js`}
          />
        </Head>
        <Authenticator>
          <ApiConnection>
            <Component {...pageProps} url={url} />
          </ApiConnection>
        </Authenticator>
        <Favicon />
      </>
    );
  }
}

export default MyApp;
