import React, { useState } from 'react';
import { bp, color, fontSize } from 'lib/variables';
import useSortableData from '../../lib/withSortedItems';
import SelectFilter from 'components/Filters';

const getOptionsFromFacts = (facts, key) => {
    let uniqueOptions= facts &&
      new Set(facts.filter(f => f[key]).map(f => f[key]));

    return [...uniqueOptions].sort();
};

const Facts = ({ facts }) => {
    const { sortedItems, getClassNamesFor, requestSort } = useSortableData(facts, {key: 'name', direction: 'ascending'});
    const [nameSelected, setName] = useState([]);
    const [sourceSelected, setSource] = useState([]);
    const [categorySelected, setCategory] = useState([]);

    const [factTerm, setFactTerm] = useState('');
    const [hasFilter, setHasFilter] = React.useState(false);

    const names = getOptionsFromFacts(facts, 'name');
    const sources = getOptionsFromFacts(facts, 'source');
    const categories = getOptionsFromFacts(facts, 'category');

    // Handlers
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

    const handleNameChange = (name) => {
        let values = name && name.map(n => n.value) || [];
        setName(values);
    };

    const handleSourceChange = (source) => {
        let values = source && source.map(s => s.value) || [];
        setSource(values);
    };

    const handleCategoryChange = (category) => {
        let values = category && category.map(c => c.value) || [];
        setCategory(values);
    };

    // Options
    const nameOptions = (name) => {
        return name && name.map(n => ({ value: n, label: n}));
    };

    const sourceOptions = (sources) => {
        return sources && sources.map(s => ({ value: s, label: s}));
    };

    const categoryOptions = (category) => {
        return category && category.map(c => ({ value: c, label: c}));
    };

    // Selector filtering
    const matchesNameSelector = (item) => {
        return (nameSelected.length > 0) ?
          Object.keys(item).some(key => {
              if (item[key] !== null) {
                  return nameSelected.indexOf(item['name'].toString()) > -1;
              };
          })
          : true;
    }

    const matchesSourceSelector = (item) => {
        return (sourceSelected.length > 0) ?
          Object.keys(item).some(key => {
              if (item[key] !== null) {
                  return sourceSelected.indexOf(item['source'].toString()) > -1;
              };
          })
          : true;
    }

    const matchesCategorySelector = (item) => {
        return (categorySelected.length > 0) ?
          Object.keys(item).some(key => {
              if (item[key] !== null) {
                  return categorySelected.indexOf(item['category'].toString()) > -1;
              };
          })
          : true;
    }

    const matchesTextFilter = (item) => {
        return (factTerm != null || factTerm !== '') ?
          Object.keys(item).some(key => {
              if (item[key] !== null) {
                  return item[key].toString().toLowerCase().includes(factTerm.toLowerCase());
              }
          })
          : true;
    }

    const shouldItemBeShown = (item) => {
        return (matchesNameSelector(item) && matchesSourceSelector(item) && matchesCategorySelector(item)  && matchesTextFilter(item));
    };

    return (
        <div className="facts">
            <div className="overview">
                <ul className="overview-list">
                    <li className="result"><label>Facts </label><span className="text-large">{Object.keys(sortedItems).length}</span></li>
                </ul>
            </div>
            <div className="filters-wrapper">
                <div className="select-filters">
                    <SelectFilter
                      title="Name"
                      loading={!names}
                      options={names && nameOptions(names)}
                      onFilterChange={handleNameChange}
                      isMulti
                    />
                    <SelectFilter
                      title="Source"
                      loading={!sources}
                      options={sources && sourceOptions(sources)}
                      onFilterChange={handleSourceChange}
                      isMulti
                    />
                    <SelectFilter
                      title="Category"
                      loading={!categories}
                      options={categories && categoryOptions(categories)}
                      onFilterChange={handleCategoryChange}
                      isMulti
                    />
                </div>
            </div>
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
                    onClick={() => handleSort('source')}
                    className={`button-sort value ${getClassNamesFor('source')}`}
                >
                    Source
                </button>
                <button
                  type="button"
                  onClick={() => handleSort('category')}
                  className={`button-sort value ${getClassNamesFor('category')}`}
                >
                    Category
                </button>
                <button
                    type="button"
                    onClick={() => handleSort('value')}
                    className={`button-sort value ${getClassNamesFor('value')}`}
                >
                    Value
                </button>
            </div>
            <div className="facts-container">
                {sortedItems.filter(item => shouldItemBeShown(item)).length == 0 &&
                <div className="data-table">
                    <div className="data-none">
                        No Facts
                    </div>
                </div>
                }
                {sortedItems
                  .filter(item => shouldItemBeShown(item))
                  .map((fact) => {
                    return (
                        <div className="data-row row-heading" key={fact.id}>
                            <div className="col col-1">
                                <div className="name">{fact.name}</div>
                                <div className="description">{fact.description}</div>
                            </div>
                            <div className="col col-2">{fact.source}</div>
                            { fact.type == "URL"
                              ? <div className="col col-3"><a className="external-link" href={fact.value} target="_blank">{fact.value}</a></div>
                              : <div className="col col-3">{fact.value}</div>
                            }
                            <div className="col col-2">{fact.category}</div>
                            <div className="col col-3">{fact.value}</div>
                        </div>
                    );
                })}
            </div>
            <style jsx>{`
              .header {
                @media ${bp.smallOnly} {
                  flex-wrap: wrap;
                  margin: 10px;
                }
                @media ${bp.wideUp} {
                  align-items: center;
                  display: flex;
                  margin: 15px 20px 10px;
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

              .text-large {
                font-size: 1.4em;
              }

              .overview {
                .overview-list {
                  display: flex;
                  justify-content: space-between;
                  padding: 10px 20px;
                  margin: 0 0 20px;
                  background: #f3f3f3;

                  li.result {
                    display: flex;
                    flex-direction: column;
                    margin: 0;
                  }
                }
              }

              .filters-wrapper {
                .select-filters {
                  display: flex;
                  flex-direction: column;
                  @media ${bp.wideUp} {
                    flex-flow: row;
                  }

                  &:first-child {
                    padding-bottom: 1em;
                  }
                }
              }

              input#filter {
                width: 100%;
                border: none;
                padding: 10px 20px;
                margin: 0;
                font-style: italic;
              }

              .button-sort {
                color: #5f6f7a;
                position: relative;
                font-family: 'source-code-pro',sans-serif;
                font-size: 13px;
                font-size: 0.8125rem;
                line-height: 1.4;
                text-transform: uppercase;
                padding-left: 20px;
                border: none;
                background: none;
                cursor: pointer;

                &:after {
                  position: absolute;
                  right:  -18px;
                  top: 0;
                  width: 20px;
                  height: 20px;
                }

                &.ascending:after {
                  content: ' \\25B2';
                }

                &.descending:after {
                  content: ' \\25BC';
                }

                &:first-child {
                  padding-left: 0;
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
                display: flex;
                justify-content: space-between;
                border: 1px solid ${color.white};
                border-bottom: 1px solid ${color.lightestGrey};
                border-radius: 0;
                line-height: 1.5rem;

                @media ${bp.smallOnly} {
                  padding: 10px;
                }

                @media ${bp.wideUp} {
                  padding: 15px 0;
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

                .col {
                  @media ${bp.wideUp} {
                    padding: 0 20px;
                  }
                  width: 33.33%;
                }

                .col-2 {
                  text-align: center;
                }

                .col-3  {
                  text-align: end;
                }

                .description {
                  font-style: italic;
                  font-size: 12px;
                }

                a.external-link {
                  color: ${color.brightBlue};
                  text-decoration: underline;
                  font-style: italic;
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

              .row-heading {
                background: ${color.white};
              }
            `}</style>
        </div>
    );
};

export default Facts;
