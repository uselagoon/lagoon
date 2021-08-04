import LoadingPage from 'pages/_loading';
import renderWhile from 'lib/renderWhile';

export default renderWhile(
  ({ loading }) => loading,
  LoadingPage
);
