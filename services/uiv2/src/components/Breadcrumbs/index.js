import React from 'react';
import { color } from 'lib/variables';

/**
 * Displays the Project and, optionally, the Environment breadcrumbs.
 */
const Breadcrumbs = ({ children }) => (
  <div className="breadcrumbs-wrapper">
    <div className="breadcrumbs">{children}</div>
    <style jsx>{`
      .breadcrumbs-wrapper {
        background-color: ${color.white};
        border-bottom: 1px solid ${color.midGrey};
      }
      .breadcrumbs {
        display: flex;
        margin: 0 2em;
      }
    `}</style>
  </div>
);

export default Breadcrumbs;
