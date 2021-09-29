import React from 'react';
import { color } from 'lib/variables';


/**
 * Button that deploys the latest environment.
 */
const ResultsLimited = ({ limit, results, message }) => {

  return (
    // if the number of results = the limit, then display a message that the results are limited
    // if the number of results is less than the limit, the message won't be displayed
    // the number of results will never be more than the limit (see deployments.js, backups.js, and tasks.js)
    // as the limit is set here and the results returned will either be less than or equal to this limit, never more
    (limit == results) && (
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
