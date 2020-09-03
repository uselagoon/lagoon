import React, { useState, useEffect } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableProblemsData from './sortedItems';
import Accordion from 'components/Accordion';
import * as moment from "moment";

const Problems = ({ problems }) => {
    const { sortedItems, requestSort, getClassNamesFor } = useSortableProblemsData(problems);

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
              Problem id
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
                onClick={() => handleSort('source')}
                className={`button-sort source ${getClassNamesFor('source')}`}
            >
              Source
            </button>
            <button
                type="button"
                onClick={() => handleSort('created')}
                className={`button-sort created ${getClassNamesFor('created')}`}
            >
              Created
            </button>
            <button
                type="button"
                onClick={() => handleSort('severityScore')}
                className={`button-sort severityScore ${getClassNamesFor('severityScore')}`}
            >
              Severity Score
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
          {!sortedItems.filter(item => filterResults(item)) && <div className="data-none">No Problems</div>}
          {sortedItems.filter(item => filterResults(item)).map((problem) => {

            const {id, description, environment, project, data, service, deleted, version, fixedVersion,
                links, __typename, created, ...selectedColumns} = problem;
            const formatCreated = moment.utc(created)
                .local()
                .format('DD MM YYYY, HH:mm:ss');
            const { identifier, severity, source, severityScore, associatedPackage } = selectedColumns;
            const columns = {identifier, severity, source, created: formatCreated, severityScore, associatedPackage};

            return (
                <Accordion
                    key={problem.id}
                    columns={columns}
                    meta={problem.project}
                    defaultValue={false}
                    className="data-row row-heading">
                    <div className="expanded-wrapper">
                      {problem.description && problem.description.length > 0 && (<div className="fieldWrapper">
                          <label>Problem Description</label>
                          <div className="description">{problem.description}</div>
                        </div>)}
                      {problem.version && problem.version.length > 0 && (<div className="fieldWrapper">
                        <label>Problem Version</label>
                        <div className="version">{problem.version}</div>
                      </div>)}
                      {problem.fixedVersion && problem.fixedVersion.length > 0 && (<div className="fieldWrapper">
                        <label>Problem Fixed in Version</label>
                        <div className="fixed-version">{problem.fixedVersion}</div>
                      </div>)}
                      {problem.links && problem.links.length > 0 && (<div className="fieldWrapper">
                        <label>Associated link (CVE description etc.)</label>
                        <div className="links"><a href={problem.links} target="_blank">{problem.links}</a></div>
                      </div>)}
                      {problem.data && (
                        <div className="rawdata">
                          <label>Raw data</label>
                          <div className="rawdata-elements">
                          {Object.entries(JSON.parse(problem.data)).map(([a, b]) => {
                            if (b) {
                              return (
                                <div key={`${a.toLowerCase()}-${problem.id}`} className="rawdata-element">
                                  <label>{a}</label>
                                  <div className="data"><pre>{b}</pre></div>
                                </div>
                              );
                            }
                          })}
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
              align-items: center;
              display: flex;
              margin: 0 0 14px;
              padding: 0px 12px;
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
            width: calc(100% / 6);

            &.identifier {
              width: 25%;
              text-align: left;
            }

            &.ascending:after {
              content: ' \\25B2';
            }

            &.descending:after {
              content: ' \\25BC';
            }
          }

          .expanded-wrapper {
            padding: 20px;
            background: ${color.lightestGrey};
            .fieldWrapper {
              padding-bottom: 20px;
            }
          }

          .rawdata {
            .rawdata-elements {
              border: 1px solid ${color.white};
              border-bottom: 1px solid ${color.lightestGrey};
              border-radius: 0;
              line-height: 1.5rem;
              padding: 8px 0 7px 0;
              background-color: ${color.white};
              border: 1px solid ${color.lightestGrey};

              @media ${bp.wideUp} {
                display: flex;
                justify-content: space-between;
                flex-direction: column;
              }

              & > div {
                padding-left: 20px;
                @media ${bp.wideDown} {
                  padding-right: 40px;
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

            .row-data {
              padding: 0;
              margin: 0;
              background: #2d2d2d;
              color: white;
              font: 0.8rem Inconsolata, monospace;
              line-height: 2;
              transition: all 0.6s ease-in-out;
            }
          }
        `}</style>
      </div>
    );
};

export default Problems;
