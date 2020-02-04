import 'isomorphic-unfetch';
import App, { Container, createUrl } from 'next/app';
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import Typekit from 'react-typekit';
import Favicon from 'components/Favicon';
import Authenticator, { AuthContext } from 'lib/Authenticator';
import ApiConnection from 'lib/ApiConnection';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

class MyApp extends App {
  render() {
    const { router, Component, pageProps, err } = this.props;
    const url = createUrl(router);

    // Catch runtime errors in production and skip authentication to avoid
    // infinite auth > error > auth > error loops.
    if (err) {
      return (
        <Container>
          <Head>
            <link rel="stylesheet" href="/static/normalize.css" />
            <Typekit kitId="ggo2pml" />
          </Head>
          <Component {...pageProps} errorMessage={err.toString()} url={url} />
          <Favicon />
        </Container>
      );
    }

    return (
      <Container>
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
      </Container>
    );
  }
}

export default MyApp;
