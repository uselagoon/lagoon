import React, { useState } from "react";
import { bp, color } from 'lib/variables';

import { Segment, Tab } from 'semantic-ui-react';



const Tabs = ({ children }) => {
  const [tabSelected, setTabSelected] = useState([]);

  const handleChange = (data) => setTabSelected(data);

  // const panes = children.map(child => {
  //   return (
  //     { menuItem: 'All Projects', render: () => <Tab.Pane>{children}</Tab.Pane> }
  //   );
  // });

  const panes = [{ menuItem: 'All Projects', render: () => <Tab.Pane className="tab-pane">{children}</Tab.Pane> }];


  // console.log(children);


  return (
    <div className="tabs-wrapper">
      <Tab panes={panes} onTabChange={handleChange} />

      <style jsx>{`
        .tabs-wrapper {
          .tabs {
            @media ${bp.tabletUp} {
              display: flex;
              // justify-content: space-between;
            }
          }
        }
      `}</style>
    </div>
  )
};

export default Tabs;
