import React, { useState, useEffect } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableData from './sortedItems';
import Accordion from '../Accordion';

const Problems = ({ problems }) => {
    const { sortedItems, requestSort, getClassNamesFor } = useSortableData(problems);

    const [currentItems, setCurrentItems] = useState(sortedItems);
    const [problemTerm, setProblemTerm] = useState('');
    const [hasFilter, setHasFilter] = React.useState(false);

    const handleProblemFilterChange = (event) => {
      setHasFilter(false);

      if (event.target.value !== null || event.target.value !== '') {
        setCurrentItems(sortedItems);
        setHasFilter(true);
      }
      setProblemTerm(event.target.value);
    };

    const handleSort = (key) => {
        if (hasFilter) {
            const results = filterResults();
            setCurrentItems(results);
        }
        else {
            setCurrentItems(sortedItems);
        }

        return requestSort(key);
    };

    const filterResults = () => {
        const lowercasedFilter = problemTerm.toLowerCase();

        return sortedItems.filter(item => {
            if (problemTerm == null || problemTerm === '') {
                setHasFilter(false);
                return problems;
            }

            return Object.keys(item).some(key =>
                item[key].toString().toLowerCase().includes(lowercasedFilter))
        });
    };

    useEffect(() => {
      const results = filterResults();
      setCurrentItems(results);
    }, [problemTerm]);

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
                className={`button-sort ${getClassNamesFor('identifier')}`}
            >
              Problem id
            </button>
            <button
                type="button"
                onClick={() => handleSort('created')}
                className={`button-sort ${getClassNamesFor('created')}`}
            >
              Created
            </button>
            <button
                type="button"
                onClick={() => handleSort('associatedPackage')}
                className={`button-sort ${getClassNamesFor('associatedPackage')}`}
            >
              Package
            </button>
            <button
                type="button"
                onClick={() => handleSort('source')}
                className={`button-sort ${getClassNamesFor('source')}`}
            >
              Source
            </button>
            <button
                type="button"
                onClick={() => handleSort('severity')}
                className={`button-sort ${getClassNamesFor('severity')}`}
            >
              Severity
            </button>
            <button
                type="button"
                onClick={() => handleSort('severityScore')}
                className={`button-sort ${getClassNamesFor('severityScore')}`}
            >
              Severity Score
            </button>
        </div>
        <div className="data-table">
          {!currentItems.length && <div className="data-none">No Problems</div>}
            {currentItems.map((problem) => (
                <Accordion
                    key={problem.id}
                    heading={problem}
                    defaultValue={false}
                    className="data-row row-heading"
                    onToggle={visibility => {
                        console.log('visibility -->', visibility);
                    }}>
                    <div className="version">{problem.version}</div>
                    <div className="fixedVersion">{problem.fixedVersion}</div>
                    <div className="links">{problem.links}</div>
                    <div className="description">{problem.description}</div>
                    <div className={`data-row row-data`}>
                        <div className="data">{problem.data}</div>
                    </div>
                </Accordion>
            ))}
        </div>
    <style jsx>{`
      .header {
        @media ${bp.wideUp} {
          align-items: center;
          display: flex;
          margin: 0 0 14px;
          padding-right: 40px;
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
        padding-left: 20px;
        border: none;
        background: none;
        cursor: pointer;

        &.ascending:after {
          content: ' \\25B2';
        }

        &.descending:after {
          content: ' \\25BC';
        }
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

export default Problems;
