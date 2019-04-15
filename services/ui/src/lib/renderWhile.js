import * as R from 'ramda';
import branch from 'recompose/branch';
import renderComponent from 'recompose/renderComponent';

export default (predicate, component) =>
  branch(props => predicate(props), renderComponent(component));
