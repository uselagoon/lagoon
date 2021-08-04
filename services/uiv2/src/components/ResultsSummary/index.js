import React from 'react';
import { bp, color } from 'lib/variables';

const ResultsSummary = ({ results, count, page, numResultsPerPage }) => {
  const pages = (page - 1) * numResultsPerPage;
  const currentTotal = pages + results.length;

  return (
    <div className="project-summary-wrapper">
      <div className="info-box">{`Search & filter projects by their active environments`}</div>
      <div className='project-summary'>
        <label>Total: {`${results && currentTotal} / ${count && count}`}</label>
      </div>
      <style jsx>{`
        .project-summary-wrapper {
          display: flex;
          justify-content: space-between;
          padding: 0 0 1em;
        }
        .project-summary {
          @media ${bp.tabletUp} {
            display: flex;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
};

export default ResultsSummary;
