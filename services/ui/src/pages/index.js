import React from 'react';
import Router from 'next/router';

export default class IndexPage extends React.Component {
  static async getInitialProps({ res }) {
    if (res) {
      res.writeHead(302, {
        Location: '/projects'
      });
      res.end();
    } else {
      Router.push('/projects');
    }
    return {};
  }
}
