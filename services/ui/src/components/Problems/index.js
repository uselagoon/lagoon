import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { bp, color, fontSize } from 'lib/variables';

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = React.useState(config);

  const sortedItems = React.useMemo(() => {
    let sortableItems = [...items];

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {

        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }

        return 0;
      });
    }

    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';

    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const Problems = ({ problems }) => {
  const { items, requestSort, sortConfig } = useSortableData(problems);

  const [openRowActive, setOpenRowState] = useState(false);
  const [problemTerm, setProblemTerm] = useState('');
  const [problemResults, setProblemResults] = React.useState([]);

  const getClassNamesFor = (name) => {
    if (!sortConfig) {
        return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  const onHeadingClick = (problem, index, e) => {
    setOpenRowState(!openRowActive);
  };

  const handleProblemIdFilter = event => {
      setProblemTerm(event.target.value);
  };

  useEffect(() => {
      const lowercasedFilter = problemTerm.toLowerCase();

      const results = items.filter(item => {
          if (problemTerm == null || problemTerm == '') {
              return items;
          }
           return Object.keys(item).some(key =>
               item[key].toString().toLowerCase().includes(lowercasedFilter))
      });

      setProblemResults(results);
  }, [problemTerm]);

  return (
    <div className="problems">
        <div className="filters">
            <input type="text" id="filter"
                   placeholder="Filter problems e.g. Drutiny"
                   value={problemTerm}
                   onChange={handleProblemIdFilter}
            />
        </div>
        <div className="header">
            <button
                type="button"
                onClick={() => requestSort('identifier')}
                className={`button-sort ${getClassNamesFor('identifier')}`}
            >
              Problem id
            </button>
            <button
                type="button"
                onClick={() => requestSort('created')}
                className={`button-sort ${getClassNamesFor('created')}`}
            >
              Created
            </button>
            <button
                type="button"
                onClick={() => requestSort('source')}
                className={`button-sort ${getClassNamesFor('source')}`}
            >
              Source
            </button>
            <button
                type="button"
                onClick={() => requestSort('severity')}
                className={`button-sort ${getClassNamesFor('severity')}`}
            >
              Severity
            </button>
            <button
                type="button"
                onClick={() => requestSort('severityScore')}
                className={`button-sort ${getClassNamesFor('severityScore')}`}
            >
              Severity Score
            </button>
        </div>
        <div className="data-table">
          {!items.length && <div className="data-none">No Problems</div>}
            {problemResults.map((problem, index) => (
              <div key={problem.id} className={`data-row--wrapper`}>
                <div className="data-row row-heading" onClick={(e) => onHeadingClick(problem, index, e)}>
                    <div className="problemid">{problem.identifier}</div>
                    <div className="created">
                      {moment
                        .utc(problem.created)
                        .local()
                        .format('DD MMM YYYY, HH:mm:ss (Z)')}
                    </div>
                    <div className="source">{problem.source}</div>
                    <div className="severity">{problem.severity}</div>
                    <div className="severityscore">{problem.severityScore}</div>
                </div>
                <div className={`data-row row-data ${openRowActive ? "expanded" : ""}`}>
                    <div className="data">{problem.data}</div>
                </div>
              </div>
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

          max-height: 0;
          overflow: hidden;
          transition: all 0.6s ease-in-out;
          // opacity: 0;
          visibility: hidden;

          &.expanded {
              // opacity: 1;
              visibility: visible;
              max-height: 500px;
          }
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
