import React, { useState, useEffect } from 'react';
import { useQuery } from "@apollo/react-hooks";
import getSeverityEnumQuery, {getProjectOptions, getSourceOptions, getServiceOptions} from 'components/Filters/helpers';
import { bp, color, fontSize } from 'lib/variables';
import useSortableProblemsData from './sortedItems';
import { getFromNowTime } from "components/Dates";
import Problem from "components/Problem";
import SelectFilter from 'components/Filters';

const getOptionsFromProblems = (problems, key) => {
  let uniqueOptions= problems && new Set(problems.map(p => {
    return p[key];
  }));
  return [...uniqueOptions];
};

const Problems = ({problems, environment}) => {
  const { sortedItems, requestSort, getClassNamesFor } = useSortableProblemsData(problems);
  const [severitySelected, setSeverity] = useState([]);
  const [sourceSelected, setSource] = useState([]);
  const [servicesSelected, setService] = useState([]);

  const [problemTerm, setProblemTerm] = useState('');
  const [hasFilter, setHasFilter] = useState(false);
  const [problemStats, setProblemStats] = useState([]);

  const severities = getOptionsFromProblems(problems, 'severity');
  const sources = getOptionsFromProblems(problems, 'source');
  const services = getOptionsFromProblems(problems, 'service');


  // Handlers
  const handleProblemFilterChange = (event) => {
    setHasFilter(false);

    if (event.target.value !== null || event.target.value !== '') {
      setHasFilter(true);
    }
    setProblemTerm(event.target.value);
  };

  const handleSourceChange = (source) => {
    let values = source && source.map(s => s.value) || [];
    setSource(values);
  };

  const handleSeverityChange = (severity) => {
    let values = severity && severity.map(s => s.value) || [];
    setSeverity(values);
  };

  const handleServiceChange = (service) => {
    let values = service && service.map(s => s.value) || [];
    setService(values);
  };

  // Options
  const severityOptions = (severity) => {
    return severity && severity.map(s => ({ value: s, label: s}));
  };

  const sourceOptions = (sources) => {
    return sources && sources.map(s => ({ value: s, label: s}));
  };

  const serviceOptions = (services) => {
    return services && services.map(s => ({ value: s, label: s}));
  };

  // Filters
  const severityFilter = (item) => {
    return Object.keys(item).some(key => {
        if (item[key] !== null) {
          return severitySelected.indexOf(item['severity'].toString()) > -1;
        };
    });
  }

  const sourceFilter = (item) => {
    return Object.keys(item).some(key => {
        if (item[key] !== null) {
          return sourceSelected.indexOf(item['source'].toString()) > -1;
        };
    });
  }

  const serviceFilter = (item) => {
    return Object.keys(item).some(key => {
        if (item[key] !== null) {
          return servicesSelected.indexOf(item['service'].toString()) > -1;
        };
    });
  }

  // Filter by select fields and text input field.
  const filterResults = (item) => {
    let filtered = true;

    if (severitySelected.length > 0 && filtered) {
      filtered = severityFilter(item);
    }

    if (sourceSelected.length > 0 && filtered) {
      filtered = sourceFilter(item);
    }

    if (servicesSelected.length > 0 && filtered) {
      filtered = serviceFilter(item);
    }

    // Filter text input
    const lowercasedFilter = problemTerm.toLowerCase();
    if (filtered && (problemTerm != null || problemTerm !== '')) {
      filtered = Object.keys(item).some(key => {
        if (item[key] !== null) {
          return item[key].toString().toLowerCase().includes(lowercasedFilter);
        }
      });
    }

    return filtered;
  };

  const handleSort = (key) => {
    return requestSort(key);
  };

  useEffect(() => {
    let stats = {
      'critical': sortedItems.filter(p => p.severity === 'CRITICAL').length,
      'high': sortedItems.filter(p => p.severity === 'HIGH').length,
      'medium': sortedItems.filter(p => p.severity === 'MEDIUM').length,
      'low': sortedItems.filter(p => p.severity === 'LOW').length
    };

    if (stats != problemStats) {
      setProblemStats(stats);
    }
  }, []);

  return (
      <div className="problems">
        <div className="overview">
          <ul className="overview-list">
            <li className="result"><label>Problems </label><span className="text-large">{Object.keys(sortedItems).length}</span></li>
            <li className="result"><label>Critical </label><span className="text-large red">{problemStats.critical}</span></li>
            <li className="result"><label>High </label><span className="text-large blue">{problemStats.high}</span></li>
            <li className="result"><label>Medium </label><span className="text-large yellow">{problemStats.medium}</span></li>
            <li className="result"><label>Low </label><span className="text-large grey">{problemStats.low}</span></li>
          </ul>
        </div>
        <div className="filters-wrapper">
          <div className="select-filters">
            <SelectFilter
              title="Severity"
              // loading={!severities}
              options={severities && severityOptions(severities)}
              // defaultValue={{value: "CRITICAL", label: "CRITICAL"}}
              onFilterChange={handleSeverityChange}
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
              title="Service"
              loading={!services}
              options={services && serviceOptions(services)}
              // defaultValue={{value: "cli", label: "cli"}}
              onFilterChange={handleServiceChange}
              isMulti
            />
          </div>
        </div>
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
              onClick={() => handleSort('service')}
              className={`button-sort service ${getClassNamesFor('service')}`}
          >
              Service
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
            {sortedItems.filter(item => filterResults(item)).length == 0 &&
              <div className="data-table">
                <div className="data-none">
                  No Problems
                </div>
              </div>
            }
            {sortedItems
              .filter(item => filterResults(item))
              .map((problem) => {
                return <Problem key={`${problem.identifier}-${problem.id}`} problem={problem}/>
              })
            }
        </div>
        <style jsx>{`
            .header {
              margin: 10px 0px;
              padding: 10px 0px;
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

            .text-large {
              font-size: 1.4em;
            }

            .red {
              color: ${color.red};
            }

            .blue {
              color: ${color.blue};
            }

            .yellow {
              color: ${color.lightestBlue};
            }

            .grey {
              color: ${color.grey};
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
