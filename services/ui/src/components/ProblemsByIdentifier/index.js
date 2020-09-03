import React, { useState } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableData from './sortedItems';
import Accordion from 'components/Accordion';
import ProblemsLink from 'components/link/Problems';

const ProblemsByIdentifier = ({ problems }) => {
    const { sortedItems, getClassNamesFor, requestSort } = useSortableData(problems);

    const [problemTerm, setProblemTerm] = useState('');
    const [hasFilter, setHasFilter] = React.useState(false);
    const [moreProjectsLimit, setMoreProjectsLimit] = React.useState(5);

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

    const onLoadMore = () => {
      setMoreProjectsLimit(moreProjectsLimit+moreProjectsLimit);
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
            onClick={() => handleSort('projectsAffected')}
            className={`button-sort projectsAffected ${getClassNamesFor('projectsAffected')}`}
          >
            Projects affected
          </button>
        </div>
        <div className="data-table">
          {!sortedItems.filter(item => filterResults(item)).length && <div className="data-none">No Problems</div>}
          {sortedItems.filter(item => filterResults(item)).map((item) => {
            const {identifier, source, severity, problems, environment } = item;
            const { description, associatedPackage, links } = problems[0] || '';

            const columns = {
              identifier: identifier, source, severity,
              projectsAffected: problems && problems.filter(p => p != null).length || 0
            };

            return (
              <Accordion
                key={identifier}
                columns={columns}
                defaultValue={false}
                className="data-row row-heading"
              >
                <div className="expanded-wrapper">
                  <div className="left-content">
                    <div className="fieldWrapper">
                      <label>Problem Description</label>
                      {description && <div className="description">
                          {description.length > 250 ? description.substring(0, 247)+'...' : description}
                      </div>}
                    </div>
                    <div className="fieldWrapper">
                      <label>Package</label>
                      {associatedPackage && <div className="package">{associatedPackage}</div>}
                    </div>
                    <div className="fieldWrapper">
                      <label>Associated link (CVE description etc.)</label>
                      {links && <div className="links"><a href={links} target="_blank">{links}</a></div>}
                    </div>
                  </div>
                  <div className="right-content">
                    <div className="fieldWrapper">
                      <label>Projects:Environments affected:</label>
                      {problems && problems.filter(p => p != null).slice(0, moreProjectsLimit).map(problem => {
                        const { id, name: envName, openshiftProjectName, environmentType, project } = problem.environment || '';

                        return (
                          <div key={id} className="name">
                            <ProblemsLink
                              environmentSlug={openshiftProjectName}
                              projectSlug={project && project.name}
                              className="problems-link"
                            >
                              {project ? `${project.name}` : ''}{envName ? ` : ${envName.toLowerCase()}` : ''}
                            </ProblemsLink>
                          </div>
                        )
                      })}
                      {problems && problems.filter(p => p != null).length > moreProjectsLimit &&
                        <button className="button more" onClick={e => onLoadMore(e)}>
                          More...
                        </button>
                      }
                    </div>
                  </div>
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
              padding: 0 2em 1em 0;
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

            .row-data {
              padding: 0;
              margin: 0;
              background: #2d2d2d;
              color: white;
              font: 0.8rem Inconsolata, monospace;
              line-height: 2;
              transition: all 0.6s ease-in-out;
            }

            .data {
                padding: 20px;
                width: 100%;
            }
          }
        `}</style>
      </div>
    );
};

export default ProblemsByIdentifier;
