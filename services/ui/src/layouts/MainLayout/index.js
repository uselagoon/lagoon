import GlobalStyles from 'layouts/GlobalStyles';
import Header from 'components/Header';

/**
 * The main layout includes the Lagoon UI header.
 */
const MainLayout = ({ children }) => (
  <GlobalStyles>
    <Header />
    { children }
  </GlobalStyles>
);

export default MainLayout;
