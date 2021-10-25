import React from 'react';
import ReactSelect from 'react-select';
import { color } from 'lib/variables';

const options = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: 'all', label: 'all' }
]
const handleChange = (values) => {
  console.log(values);
  window.location.href = (window.location.href.split('?')[0]) + "?limit="+values.value;
};
const customStyles = {
  menu: (provided, state) => ({
    ...provided,
    width: 200,
  }),
  control: (provided) => ({
    ...provided,
    width: 200,
  }),
  singleValue: (provided, state) => {
    return { ...provided, opacity, transition };
  }
}

/**
 * Button that deploys the latest environment.
 */
const ResultsLimited = ({ limit, results, message }) => {

  return (
    // if the number of results = the limit, then display a message that the results are limited
    // if the number of results is less than the limit, the message won't be displayed
    // the number of results will never be more than the limit (see deployments.js, backups.js, and tasks.js)
    // as the limit is set here and the results returned will either be less than or equal to this limit, never more
    (
    <div className="resultsLimited">
      {limit &&
        <React.Fragment>
          <div className="description">
            Number of results displayed is limited to {limit}{message}
          </div>
        </React.Fragment>
      }
      <div className="results">
      {<ReactSelect
        styles={customStyles}
        aria-label="Results"
        placeholder="Results to display..."
        name="results"
        onChange={handleChange}
        options={options}
        required
      />}
      </div>
      <style jsx>
        {`
          .resultsLimited {
            .results {
              padding: 8px;
              display: flex;
              justify-content: right;
            }
            .description {
              background: ${color.white};
              border: 1px solid ${color.lightestGrey};
              border-radius: 3px;
              box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);
              justify-content: space-between;
              margin-top: 8px;
              padding: 8px;
              // text-align: center;
              display: flex;
              justify-content: center;
              color: ${color.darkGrey};
            }
          }
        `}
      </style>
    </div>
  ));
};

export default ResultsLimited;
