import React from 'react';
import { color } from 'lib/variables';


/**
 * Button that deploys the latest environment.
 */
const ResultsLimited = ({ limit, results, message }) => {

  return (
    (
    <div className="resultsLimited">
      {
        <React.Fragment>
          <div className="description2">
            Number of results displayed is limited to {limit}{message}
          </div>
        </React.Fragment>
      }
      <style jsx>
        {`
          .resultsLimited {
            background: ${color.white};
            border: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 10px;

            .description2 {
              text-align: center;
              color: ${color.darkGrey};
            }
          }
        `}
      </style>
    </div>
  ));
};

export default ResultsLimited;
