import React, { useState, useEffect } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableData from './sortedItems';
import Accordion from 'components/Accordion';

const ProblemsByProject = ({ problems }) => {
    const { sortedItems, getClassNamesFor, requestSort } = useSortableData(problems, {key: 'id', direction: 'ascending'});

    const [problemTerm, setProblemTerm] = useState('');
    const [hasFilter, setHasFilter] = React.useState(false);

    const handleProblemFilterChange = (event) => {
      setHasFilter(false);

      if (event.target.value !== null || event.target.value !== '') {
        setHasFilter(true);
      }
      setProblemTerm(event.target.value);
    };

    const handleSort = (key) => {
      return requestSort(key);
    };

    const filterResults = (item) => {
      const lowercasedFilter = problemTerm.toLowerCase();
        if (problemTerm == null || problemTerm === '') {
          return problems;
        }

        return Object.keys(item).some(key => {
          if (item[key] !== null) {
            return item[key].toString().toLowerCase().includes(lowercasedFilter);
          }
        });
    };

    return (
      <div className="problems">
        <div className="filters">
          <input type="text" id="filter" placeholder="Filter problems e.g. CVE-2020-2342"
            value={problemTerm}
            onChange={handleProblemFilterChange}
          />
        </div>
        <div className="header">
          <button
            type="button"
            onClick={() => handleSort('identifier')}
            className={`button-sort identifier ${getClassNamesFor('identifier')}`}
          >
            Problem identifier
          </button>
          <button
            type="button"
            onClick={() => handleSort('source')}
            className={`button-sort source ${getClassNamesFor('source')}`}
          >
            Source
          </button>
          <button
            type="button"
            onClick={() => handleSort('severity')}
            className={`button-sort severity ${getClassNamesFor('severity')}`}
          >
            Severity
          </button>
          <button
            type="button"
            onClick={() => handleSort('associatedPackage')}
            className={`button-sort associatedPackage ${getClassNamesFor('associatedPackage')}`}
          >
            Package
          </button>
        </div>
        <div className="data-table">
          {!sortedItems.filter(problem => filterResults(problem)).length && <div className="data-none">No Problems</div>}
          {sortedItems.filter(problem => filterResults(problem)).map((problem, index) => {

            const {identifier, source, severity, associatedPackage, data } = problem;
            const columns = {identifier, source, severity, associatedPackage};
            const parsedData = data && JSON.parse(data) || null;

            return (
              <Accordion
                key={`${identifier}-${source.toLowerCase()}-${index}`}
                columns={columns}
                defaultValue={false}
                className="data-row row-heading"
              >
                <div className="expanded-wrapper">
                  <div className="fieldWrapper">
                    <label>Problem Description</label>
                    {problem && <div className="description">
                      {(problem.description).length > 250 ? problem.description.substring(0, 247)+'...' : problem.description}
                    </div>}
                  </div>
                  <div className="fieldWrapper">
                    <label>Package</label>
                    {problem && <div className="package">{problem.associatedPackage}</div>}
                  </div>
                  <div className="fieldWrapper">
                    <label>Associated link (CVE description etc.)</label>
                    {problem && <div className="links"><a href={problem.links} target="_blank">{problem.links}</a></div>}
                  </div>
                  {problem && (<div className="fieldWrapper">
                    <label>Data:</label>
                    <div className="data-wrapper">
                      {parsedData && <div className="data">{Object.keys(parsedData).map((key, index) => {
                          return <div key={`${key}-${index}`} className="data-item"><span className="key">{key}: </span><span className="value">{`${parsedData[key]}`}</span></div>
                    })}</div>}
                  </div>
                  </div>)}
                </div>
              </Accordion>
            );
          })}
        </div>
        <style jsx>{`
          .header {
            @media ${bp.wideUp} {
              display: flex;
              margin: 0 0 14px;
            }
            @media ${bp.smallOnly} {
              flex-wrap: wrap;
            }
            @media ${bp.tabletUp} {
              margin-top: 20px;
            }

            display: flex;
            justify-content: space-between;

            label {
              display: none;
              padding-left: 20px;
              @media ${bp.wideUp} {
                display: block;
              }
            }
            .identifier {
              width: 45%;
            }
            .source {
              width: 20%;
            }
            .severity {
              width: 18%;
            }
            .projectsAffected {
              width: 17.5%;
            }
            .associatedPackage {
              width: 16%;
            }
          }

          input#filter {
            width: 100%;
            border: none;
            padding: 10px 20px;
            margin: 0;
          }
          .button-sort {
            color: #5f6f7a;
            font-family: 'source-code-pro',sans-serif;
            font-size: 13px;
            font-size: 0.8125rem;
            line-height: 1.4;
            text-transform: uppercase;
            border: none;
            background: none;
            cursor: pointer;
            text-align: left;

            &.identifier {
              padding-left: 20px;
            }

            &.ascending:after {
              content: ' \\25B2';
            }

            &.descending:after {
              content: ' \\25BC';
            }
          }

          .expanded-wrapper {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            width: 100%;
            padding: 20px;
            background: ${color.lightestGrey};

            .fieldWrapper {
              padding-bottom: 1em;
              display: flex;
              flex-direction: column;
              width: 100%;
            }

            .left-content,
            .right-content {
              display: flex;
              flex-direction: column;
              flex-basis: 100%;
              flex: 1;
            }

            .problems-link {
              color: #2bc0d8;
            }
          }

          .more {
            background: none;
            border: none;
            color: #2bc0d8;
            padding: 5px 0;
            text-transform: uppercase;
            font-size: 0.8em;
            cursor: pointer;
          }

          .data-table {
            background-color: ${color.white};
            border: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

            .data-none {
              border: 1px solid ${color.white};
              border-bottom: 1px solid ${color.lightestGrey};
              border-radius: 3px;
              line-height: 1.5rem;
              padding: 8px 0 7px 0;
              text-align: center;
            }

            .data-row {
              border: 1px solid ${color.white};
              border-bottom: 1px solid ${color.lightestGrey};
              border-radius: 0;
              line-height: 1.5rem;
              padding: 8px 0 7px 0;
              @media ${bp.wideUp} {
                display: flex;
                justify-content: space-between;
                padding-right: 15px;
              }

              & > div {
                padding-left: 20px;
                @media ${bp.wideDown} {
                  padding-right: 40px;
                }
                @media ${bp.wideUp} {

                }

              }

              &:hover {
                border: 1px solid ${color.brightBlue};
              }

              &:first-child {
                border-top-left-radius: 3px;
                border-top-right-radius: 3px;
              }

              &:last-child {
                border-bottom-left-radius: 3px;
                border-bottom-right-radius: 3px;
              }
            }

            .row-heading {
              cursor: pointer;
            }
          }

          .data-wrapper {
            background: #2d2d2d;
          }

          .data {
            padding: 20px;
            margin: 0;
            color: white;
            font: 0.8rem Inconsolata, monospace;
            line-height: 2;
            transition: all 0.6s ease-in-out;
            padding: 20px;
            width: 100%;

            .key {
              color: ${color.brightBlue};
            }
          }
        `}</style>
      </div>
    );
};

export default ProblemsByProject;
