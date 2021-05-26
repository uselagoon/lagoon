import React from 'react';
import GlobalStyles from 'layouts/GlobalStyles';
import Navigation from 'components/Navigation';

/**
 * The main navigation that sits to the left of all pages.
 */
const MainNavigation = ({ children }) => (
  <GlobalStyles>
    <Navigation>{children}</Navigation>
  </GlobalStyles>
);

export default MainNavigation;
