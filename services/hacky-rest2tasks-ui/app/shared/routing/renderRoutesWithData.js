// @flow

import React, { Component } from 'react';
import { RouterContext } from 'react-router';
import { getDataFromTree } from 'react-apollo/lib/index';

class AsyncRoute extends Component {
  state = {
    route: this.props.children,
    loading: false,
  };

  componentWillReceiveProps(nextProps) {
    if (nextProps.children === this.props.children) {
      return;
    }

    this.setState({ loading: true });

    getDataFromTree(nextProps.children, this.props).then(() => {
      if (this.props.children === nextProps.children) {
        this.setState({
          route: this.props.children,
          loading: false,
        });
      }
    });
  }

  render() {
    return React.cloneElement(this.state.route, {
      router: {
        ...this.state.route.props.router,
        loading: this.state.loading,
      },
    });
  }
}

// Delay route transition of routes with data dependencies.
const renderRoutesWithData = (client, store) => props => (
  <AsyncRoute client={client} store={store}>
    <RouterContext {...props} />
  </AsyncRoute>
);

export default renderRoutesWithData;
