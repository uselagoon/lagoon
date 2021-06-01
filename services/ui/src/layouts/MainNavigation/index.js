import React from 'react';
import GlobalStyles from 'layouts/GlobalStyles';

/**
 * The main navigation that sits to the left of all pages.
 */
const MainNavigation = ({ children }) => (
  <GlobalStyles>
    <div className="navigation">
      {children}
    </div>
  </GlobalStyles>
);

export default MainNavigation;
