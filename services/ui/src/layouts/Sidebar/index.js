import React from 'react';
import GlobalStyles from 'layouts/GlobalStyles';

/**
 * The main sidebar region that sits to the right of pages.
 */
const Sidebar = ({ children }) => (
  <GlobalStyles>
    <div className="sidebar">
      {children}
    </div>
  </GlobalStyles>
);

export default Sidebar;
