import React from 'react';
import Router from 'next/router';
import { queryStringToObject } from 'lib/util';
export default class IndexPage extends React.Component {
  static async getInitialProps({ req, res }) {
    if (res) {
      const currentUrl = new URL(req.url, `https://${req.headers.host}`);
      res.writeHead(302, {
        Location: `/projects${currentUrl.search}`
      });
      res.end();
    } else {
      Router.push({
        pathname: '/projects',
        query: queryStringToObject(location.search),
      });
    }
    return {};
  }
}
