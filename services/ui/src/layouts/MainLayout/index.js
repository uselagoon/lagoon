import GlobalStyles from 'layouts/GlobalStyles';
import Header from 'components/Header';
import Footer from 'components/Footer';

/**
 * The main layout includes the Lagoon UI header.
 */
const MainLayout = ({ children }) => (
  <GlobalStyles>
    <Header />
    { children }
    <Footer />
  </GlobalStyles>
);

export default MainLayout;
