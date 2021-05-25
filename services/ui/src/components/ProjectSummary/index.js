import React from 'react';
import { bp, color } from 'lib/variables';

const ProjectSummary = ({ menu }) => (
  <div className="project-summary-wrapper">
    <div className="info-box">Search & filter projects by their active environments</div>
    <div className='project-summary'>
        Total projects:
    </div>
    <style jsx>{`
      .project-summary-wrapper {
        display: flex;
        justify-content: space-between;
      }
      .project-summary {
        margin-bottom: 1.75em;

        @media ${bp.tabletUp} {
          display: flex;
          justify-content: space-between;
        }
      }

      .info-box {
         margin-bottom: 1.75em;
      }
    `}</style>
  </div>
);

export default ProjectSummary;
