import 'isomorphic-unfetch';
import App, { Container } from 'next/app'
import React from 'react'
import Head from 'next/head';
import getConfig from 'next/config'
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-boost';

const {serverRuntimeConfig, publicRuntimeConfig} = getConfig()

const client = new ApolloClient({
  uri: publicRuntimeConfig.API,
  headers: {
    authorization: `Bearer ${publicRuntimeConfig.API_TOKEN}`,
  },
});

class MyApp extends App {
  render() {
    const { Component, pageProps } = this.props
    return <Container>
      <Head>
        <link rel="stylesheet" href="/static/normalize.css" />
        <link rel="stylesheet" href="/static/global.css" />
      </Head>
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
    </Container>
  }
}

export default MyApp
