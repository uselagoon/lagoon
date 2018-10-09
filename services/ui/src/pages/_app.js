import 'isomorphic-unfetch';
import App, { Container } from 'next/app';
import React from 'react';
import Head from 'next/head';
import getConfig from 'next/config';
import Typekit from 'react-typekit';
import withAuth, { AuthContext } from '../lib/withAuth';
import ApiConnection from '../lib/ApiConnection';
import { bp, color, fontSize } from '../variables';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();

class MyApp extends App {
  render() {
    const { Component, pageProps, auth } = this.props;
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
        <AuthContext.Provider value={auth}>
          <ApiConnection>
            <Component {...pageProps} />
          </ApiConnection>
        </AuthContext.Provider>
        <style jsx global>{`
          * {
            box-sizing: border-box;
          }
          body {
            color: ${color.black};
            font-family: 'source-sans-pro', sans-serif;
            ${fontSize(16)};
            height: 100%;
            line-height: 1.25rem;
            overflow-x: hidden;
            .content-wrapper {
              background-color: ${color.almostWhite};
              flex: 1 0 auto;
              width: 100%;
            }
            #__next {
              display: flex;
              flex-direction: column;
              min-height: 100vh;
            }
            a {
              color: ${color.black};
              text-decoration: none;
              &.hover-state {
                position: relative;
                transition: all 0.2s ease-in-out;
                &::before,
                &::after {
                  content: '';
                  position: absolute;
                  bottom: 0;
                  width: 0px;
                  height: 1px;
                  transition: all 0.2s ease-in-out;
                  transition-duration: 0.75s;
                  opacity: 0;
                }
                &::after {
                  left: 0;
                  background-color: ${color.linkBlue};
                }
                &:hover {
                  &::before,
                  &::after {
                    width: 100%;
                    opacity: 1;
                  }
                }
              }
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
            h2 {
              ${fontSize(36, 42)};
              font-weight: normal;
              margin: 0 0 38px;
            }
            h3 {
              ${fontSize(30, 42)};
              font-weight: normal;
              margin: 0 0 36px;
            }
            h4 {
              ${fontSize(25, 38)};
              font-weight: normal;
              margin: 4px 0 0;
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
            .box {
              border: 1px solid ${color.lightestGrey};
              box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
              border-radius: 3px;
              position: relative;
              width: 100%;
              &::after {
                bottom: 4px;
                content: '';
                display: block;
                height: 20px;
                left: 15px;
                position: absolute;
                transition: box-shadow 0.5s ease;
                width: calc(100% - 30px);
              }
              &:hover {
                border: 1px solid ${color.brightBlue};
                &::after {
                  box-shadow: 0px 12px 40px 0px rgba(73, 127, 250, 0.5);
                }
              }
              a {
                background-color: ${color.white};
                border-radius: 3px;
                display: block;
                height: 100%;
                overflow: hidden;
                padding: 16px 20px;
                position: relative;
                transition: background-image 0.5s ease-in-out;
                z-index: 10;
              }
            }
            .field {
              line-height: 25px;
              a {
                color: ${color.linkBlue};
              }
            }
            label {
              color: ${color.darkGrey};
              font-family: 'source-code-pro', sans-serif;
              ${fontSize(13)};
              text-transform: uppercase;
            }
            .field-wrapper {
              display: flex;
              margin-bottom: 18px;
              @media ${bp.xs_smallUp} {
                margin-bottom: 30px;
              }
              &::before {
                @media ${bp.xs_smallUp} {
                  background-position: top 11px right 14px;
                  background-repeat: no-repeat;
                  background-size: 20px;
                  border-right: 1px solid ${color.midGrey};
                  content: '';
                  display: block;
                  height: 60px;
                  left: 0;
                  margin-left: calc(((100vw / 16) * 1.5) - 25px);
                  margin-right: 14px;
                  padding-right: 14px;
                  position: absolute;
                  width: 25px;
                }
              }
              & > div {
                @media ${bp.xs_smallUp} {
                  margin-top: 8px;
                }
              }
            }
          }
        `}</style>
      </Container>
    );
  }
}

export default withAuth(MyApp);
