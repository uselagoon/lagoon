import React, { useState, useEffect } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableData from '../../lib/withSortedItems';

const Facts = ({ facts }) => {
    const { sortedItems, getClassNamesFor, requestSort } = useSortableData(facts, {key: 'name', direction: 'ascending'});

    const [factTerm, setFactTerm] = useState('');
    const [hasFilter, setHasFilter] = React.useState(false);

    const handleFactFilterChange = (event) => {
        setHasFilter(false);

        if (event.target.value !== null || event.target.value !== '') {
            setHasFilter(true);
        }
        setFactTerm(event.target.value);
    };

    const handleSort = (key) => {
        return requestSort(key);
    };

    const filterResults = (item) => {
        const lowercasedFilter = factTerm.toLowerCase();

        if (factTerm == null || factTerm === '') {
            return facts;
        }

        return Object.keys(item).some(key => {
            if (item[key] !== null) {
                return item[key].toString().toLowerCase().includes(lowercasedFilter);
            }
        });
    };

    console.log(sortedItems);


    return (
        <div className="facts">
            <div className="filters">
                <input type="text" id="filter" placeholder="Filter facts e.g. PHP version"
                       value={factTerm}
                       onChange={handleFactFilterChange}
                />
            </div>
            <div className="header">
                <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className={`button-sort name ${getClassNamesFor('name')}`}
                >
                    Name
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('value')}
                    className={`button-sort value ${getClassNamesFor('value')}`}
                >
                    Value
                </button>
            </div>
            <div className="data-table">
                {!sortedItems.filter(fact => filterResults(fact)).length && <div className="data-none">No Facts</div>}
                {sortedItems.filter(fact => filterResults(fact)).map((fact) => {
                    return (
                        <div className="data-row row-heading" key={fact.id}>
                          <div>{fact.name}</div>
                          <div>{fact.value}</div>
                        </div>
                    );
                })}
            </div>
            <style jsx>{`
              .header {
                @media ${bp.wideUp} {
                  align-items: center;
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

              .expanded-wrapper {
                padding: 20px;
                background: ${color.lightestGrey};
                .fieldWrapper {
                  padding-bottom: 20px;
                }
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
                background: ${color.white};
              }
            `}</style>
        </div>
    );
};

export default Facts;
