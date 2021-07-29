import React, { useState } from 'react';
import GlobalStyles from 'layouts/GlobalStyles';
import { Sidebar, Menu } from 'semantic-ui-react'

  /**
 * The main navigation that sits to the left of all pages.
 */
const MainNavigation = ({ children }) => {
  const [visible, setVisible] = React.useState(true);

  return (
    <GlobalStyles>
      <Sidebar
        as={Menu}
        animation='push'
        // icon='labeled'
        direction={"left"}
        vertical
        visible={visible}
        className={"navigation"}
      >
        {children}
      </Sidebar>
    </GlobalStyles>
  );
};

export default MainNavigation;
