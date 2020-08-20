import React, { useState } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableProblemsData from './sortedItems';
import { getFromNowTime } from "components/Dates";
import Problem from "components/Problem";

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
                    Last detected
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('severityScore')}
                    className={`button-sort severityScore ${getClassNamesFor('severityScore')}`}
                >
                    Score
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('associatedPackage')}
                    className={`button-sort associatedPackage ${getClassNamesFor('associatedPackage')}`}
                >
                    Package
                </button>
            </div>
            <div className="problems-container">
                {!sortedItems.filter(item => filterResults(item)) && <div className="data-none">No Problems</div>}
                {sortedItems.filter(item => filterResults(item)).map((problem) => {
                    return <Problem key={`${problem.identifier}-${problem.id}`} problem={problem}/>
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
            font-size: 12px;
            font-size: 0.8125rem;
            line-height: 1.4;
            text-transform: uppercase;
            text-align: center;
            border: none;
            background: none;
            cursor: pointer;
            padding: 0;
            width: calc(100% / 6);

            &.identifier {
              text-align: left;
            }

            &.ascending:after {
              content: ' \\25B2';
            }

            &.descending:after {
              content: ' \\25BC';
            }
          }

         .data-none {
            border: 1px solid ${color.white};
            border-bottom: 1px solid ${color.lightestGrey};
            border-radius: 3px;
            line-height: 1.5rem;
            padding: 8px 0 7px 0;
            text-align: center;
          }
        `}</style>
        </div>
    );
};

export default Problems;