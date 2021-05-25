import React from 'react';
import GlobalStyles from 'layouts/GlobalStyles';
import Header from 'components/Header';
import MainNavigation from '../MainNavigation';
import Footer from 'components/Footer';

/**
 * The main layout includes the Lagoon UI header.
 */
const MainLayout = ({ children }) => (
  <GlobalStyles>
    <Header />
    <div className="main">
      <MainNavigation />
      { children }
    </div>
    <Footer />
  </GlobalStyles>
);

export default MainLayout;
