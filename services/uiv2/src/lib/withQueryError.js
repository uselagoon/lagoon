import QueryError from 'components/errors/QueryError';
import renderWhile from 'lib/renderWhile';

export default renderWhile(
  ({ error }) => error,
  QueryError
);
