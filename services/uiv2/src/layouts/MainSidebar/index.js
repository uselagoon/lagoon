import React, { useState, useEffect, createRef } from 'react';
import GlobalStyles from 'layouts/GlobalStyles';
import { Grid, Sidebar, Button, Icon } from 'semantic-ui-react';
// import { useScrollPosition } from 'lib/util';
import { useScrollPosition } from '@n8tb1t/use-scroll-position';

/**
 * The main sidebar region that sits to the right of pages.
 */
const MainSidebar = ({ children, selected, innerRef }) => {
  const [visible, setVisible] = useState(false);
  const [sidebarStyle, setSidebarStyle] = useState({});

  const handleSidebarClose = (e, data) => {
    return setVisible(!visible);
  }

  useScrollPosition(
    ({ prevPos, currPos }) => {
      const OFFSET_POS = {
        y: currPos.y
      }

      const HEADER_HEIGHT = 15;

      const scrolledToHeader = OFFSET_POS.y >= -HEADER_HEIGHT;
      const scrolledPastHeader = OFFSET_POS.y <= -HEADER_HEIGHT;

      const makeStickyStyling = {
        position: 'relative',
        top: scrolledPastHeader ? -HEADER_HEIGHT : scrolledToHeader ? OFFSET_POS.y : HEADER_HEIGHT
      }

      if (JSON.stringify(makeStickyStyling) === JSON.stringify(sidebarStyle)) return
      setSidebarStyle(makeStickyStyling)
    },
    [sidebarStyle]
  )

  useEffect(() => {
    const hasResultSelection = selected !== "";
    if (!visible && hasResultSelection) {
      setVisible(hasResultSelection);
    }
  }, [selected])

  return (
    <GlobalStyles>
        <div className={`sidebar-button ${visible ? "visible" : "hidden"}`}>
          <div className="sidebar-button-sticky">
            <Button className={visible ? "visible" : "hidden"} onClick={(e, data) => handleSidebarClose(e, data)}>
              <Icon name={`angle ${visible ? "right" : "left"}`}/>
            </Button>
          </div>
        </div>
          <Sidebar
            animation="push"
            direction={"right"}
            visible={visible}
            className={`projects`}
            width="wide"
          >
            <div style={{ ...sidebarStyle }}>
              <Button
                onClick={(e, data) => handleSidebarClose(e, data)}
                compact
                basic
                className={"close-sidebar"}
                icon="close"
                size="large"
              />
              {children}
            </div>
          </Sidebar>
    </GlobalStyles>
  )
};

export default MainSidebar;
