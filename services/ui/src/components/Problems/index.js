import React, { useState } from 'react';
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

  const getClassNamesFor = (name) => {
    if (!sortConfig) {
        return;
    }
    return sortConfig.key === name ? sortConfig.direction : undefined;
  };

  return (
    <div className="problems">
        <div className="header">
            <button
                type="button"
                onClick={() => requestSort('id')}
                className={getClassNamesFor('id')}
            >
              Problem id
            </button>
            <label className="created">Created</label>
            <label className="source">Source</label>
            <label className="data">Data</label>
            <label className="severity">Severity</label>
            <label className="severityscore">Severity Score</label>
        </div>
        <div className="data-table">
          {!items.length && <div className="data-none">No Problems</div>}
            {items.map(problem => (
              <div className="data-row" key={problem.id}>
                <div className="problemid">{problem.id}</div>
                <div className="created">
                  {moment
                    .utc(problem.created)
                    .local()
                    .format('DD MMM YYYY, HH:mm:ss (Z)')}
                </div>
                <div className="source">{problem.source}</div>
                <div className="data">{problem.data}</div>
                <div className="severity">{problem.severity}</div>
                <div className="severityscore">{problem.severityScore}</div>
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
          margin-top: 40px;
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
      }
    `}</style>
    </div>
  );
};

export default Problems;
