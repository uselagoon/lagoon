import 'isomorphic-unfetch';
import App, { Container } from 'next/app'
import React from 'react'
import Head from 'next/head';
import getConfig from 'next/config'
import { ApolloProvider } from 'react-apollo';
import ApolloClient from 'apollo-boost';
import { bp, color } from '../variables';

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
      </Head>
      <ApolloProvider client={client}>
        <Component {...pageProps} />
      </ApolloProvider>
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial;
          font-size: 16px;
          height: 100%;
          line-height: 1.25rem;
          overflow-x: hidden;
          .content-wrapper {
            margin: 0 auto;
            max-width: 1400px;
            padding: 0 20px;
            width: 100%;
          }
          a {
            color: #000;
            text-decoration: none;
          }
          p {
            margin: 0 0 1.25rem;
          }
          p a {
            text-decoration: none;
            transition: background 0.3s ease-out;
          }
          strong {
            font-weight: normal;
          }
          em {
            font-style: normal;
          }
          h1 {
            font-size: 30px;
            line-height: 40px;
            margin-top: 50px;
          }
          h2 {
            font-weight: 700;
            line-height: 25px;
          }
          h4 {
            margin: 0;
          }
          ul {
            list-style: none;
            margin: 0 0 1.25rem;
            padding-left: 0;
            li {
              background-size: 8px;
              margin-bottom: 1.25rem;
              padding-left: 20px;
              a {
                text-decoration: none;
              }
            }
          }
          ol {
            margin: 0 0 1.25rem;
            padding-left: 20px;
            li {
              margin-bottom: 1.25rem;
              a {
                text-decoration: none;
              }
            }
          }
          table {
            width: 100%;
            tr {
              text-align: left;
              td {
                padding: 10px 0;
              }
            }
          }
          .field {
            margin-bottom: 20px;
            label {
              font-weight: bold;
            }
          }
        }
      `}</style>
    </Container>
  }
}

export default MyApp
