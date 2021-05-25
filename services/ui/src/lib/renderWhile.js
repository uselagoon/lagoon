import * as R from 'ramda';
import branch from 'recompose/branch';
import renderComponent from 'recompose/renderComponent';

const renderWhile = (predicate, component) =>
  branch(props => predicate(props), renderComponent(component));

export default renderWhile;