import {QueryNoHeaderError} from 'components/errors/QueryError';
import renderWhile from 'lib/renderWhile';

export default renderWhile(
  ({ error }) => error,
  QueryNoHeaderError
);
