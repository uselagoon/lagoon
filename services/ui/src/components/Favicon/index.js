import React from 'react';
import Head from 'next/head';
import { color } from 'lib/variables';

/**
 * Adds the Lagoon icon as the favicon for the website.
 */
const Favicon = () => (
  <Head>
    <link rel="apple-touch-icon" sizes="180x180" href="/static/images/favicons/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/static/images/favicons/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/static/images/favicons/favicon-16x16.png" />
    <meta name="apple-mobile-web-app-title" content="Lagoon" />
    <meta name="application-name" content="Lagoon" />
    <meta name="msapplication-TileColor" content={color.blue} />
    <meta name="theme-color" content={color.white} />
  </Head>
);

export default Favicon;
