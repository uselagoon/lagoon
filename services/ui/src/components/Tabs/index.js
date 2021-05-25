import React from 'react';
import { bp, color } from 'lib/variables';

const Tabs = ({ tabs }) => (
  <div className="tabs-wrapper">
    <ul className="tabs">
      <li>All Projects</li>
      <li>Environments</li>
      <li>Routes</li>
    </ul>
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
);

export default Tabs;
