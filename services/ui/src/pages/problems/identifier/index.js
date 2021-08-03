import React, {useState} from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from '@apollo/client/react/components';
import {useQuery} from "@apollo/client";
import AllProblemsQuery from 'lib/query/AllProblems';
import getSeverityEnumQuery, {getSourceOptions} from 'components/Filters/helpers';
import withQueryLoadingNoHeader from 'lib/withQueryLoadingNoHeader';
import withQueryErrorNoHeader from 'lib/withQueryErrorNoHeader';
import ProblemsByIdentifier from "components/ProblemsByIdentifier";
import MainLayout from 'layouts/MainLayout';
import SelectFilter from 'components/Filters';
import { bp } from 'lib/variables';

/**
 * Displays the problems overview page.
 *
 */
const ProblemsDashboardPage = () => {
  const [source, setSource] = useState([]);
  const [severity, setSeverity] = useState(['CRITICAL']);
  const [envType, setEnvType] = useState('PRODUCTION');

  const { data: severities, loading: severityLoading } = useQuery(getSeverityEnumQuery);
  const { data: sources, loading: sourceLoading } = useQuery(getSourceOptions);

  const handleEnvTypeChange = (envType) => setEnvType(envType.value);

  const handleSourceChange = (source) => {
    let values = source && source.map(s => s.value) || [];
    setSource(values);
  };

  const handleSeverityChange = (severity) => {
    let values = severity && severity.map(s => s.value) || [];
    setSeverity(values);
  };

  const sourceOptions = (sources) => {
      return sources && sources.map(s => ({ value: s, label: s}));
  };

  const severityOptions = (enums) => {
    return enums && enums.map(s => ({ value: s.name, label: s.name}));
  };

  const groupByProblemIdentifier = (problems) => problems && problems.reduce((arr, problem) => {
    arr[problem.identifier] = arr[problem.identifier] || [];
    arr[problem.identifier].push(problem);
    return arr;
  }, {});


  return (
  <>
    <Head>
      <title>Problems Dashboard</title>
    </Head>
    <MainLayout>
      <div className="filters-wrapper">
        <h2>Problems Dashboard By Identifier</h2>
        <div className="filters">
            <SelectFilter
              title="Source"
              loading={sourceLoading}
              options={sources && sourceOptions(sources.sources)}
              onFilterChange={handleSourceChange}
              isMulti
            />
            <SelectFilter
              title="Severity"
              loading={severityLoading}
              options={severities && severityOptions(severities.__type.enumValues)}
              defaultValue={{value: "CRITICAL", label: "CRITICAL"}}
              onFilterChange={handleSeverityChange}
              isMulti
            />
            <SelectFilter
              title="Type"
              defaultValue={{value: 'PRODUCTION', label: 'Production'}}
              options={[
                {value: 'PRODUCTION', label: 'Production'},
                {value: 'DEVELOPMENT', label: 'Development'}
              ]}
              onFilterChange={handleEnvTypeChange}
            />
        </div>
        <style jsx>{`
            .filters-wrapper {
              margin: 38px calc((100vw / 16) * 1);
              @media ${bp.wideUp} {
                margin: 38px calc((100vw / 16) * 2);
              }
              @media ${bp.extraWideUp} {
                margin: 38px calc((100vw / 16) * 3);
              }
              .filters {
                display: flex;
                justify-content: space-between;
                padding-bottom: 1em;
                flex-direction: column;

                @media ${bp.wideUp} {
                  flex-flow: row;
                }
              }
            }
          `}</style>
      </div>
      <Query
        query={AllProblemsQuery}
        variables={{
            source: source,
            severity: severity,
            envType: envType
        }}
        displayName="AllProblemsQuery"
      >
        {R.compose(
            withQueryLoadingNoHeader,
            withQueryErrorNoHeader
        )(({data: {problems} }) => {

          // Group problems by identifier
          const problemsById = groupByProblemIdentifier(problems) || [];
          const problemIdentifiers = problemsById && Object.keys(problemsById).map(p => {
            const problem = problemsById[p][0];

            return {identifier: p, source: problem.source, severity: problem.severity, problems: problemsById[p]};
          }, []);

          const critical = problems && problems.filter(p => p.severity === 'CRITICAL').length;
          const high = problems && problems.filter(p => p.severity === 'HIGH').length;
          const medium = problems && problems.filter(p => p.severity === 'MEDIUM').length;
          const low = problems && problems.filter(p => p.severity === 'LOW').length;

          return (
          <>
            <div className="content-wrapper">
              <div className="content">
                <div className="overview">
                  <ul className="overview-list">
                    <li className="result"><label>Results: </label>{problems && Object.keys(problems).length} Problems</li>
                    <li className="result"><label>Critical: </label>{critical}</li>
                    <li className="result"><label>High: </label>{high}</li>
                    <li className="result"><label>Medium: </label>{medium}</li>
                    <li className="result"><label>Low: </label>{low}</li>
                  </ul>
                  <ul className="overview-list">
                    <li className="result"><label>Showing: </label>{envType.charAt(0).toUpperCase() + envType.slice(1).toLowerCase()} environments</li>
                  </ul>
                </div>
                <ProblemsByIdentifier problems={problemIdentifiers || []}/>
              </div>
              <style jsx>{`
                .content-wrapper {
                  h2 {
                    margin: 38px calc((100vw / 16) * 1) 0;
                    @media ${bp.wideUp} {
                      margin: 62px calc((100vw / 16) * 2) 0;
                    }
                    @media ${bp.extraWideUp} {
                      margin: 62px calc((100vw / 16) * 3) 0;
                    }
                  }
                  .content {
                    margin: 38px calc((100vw / 16) * 1);
                    @media ${bp.wideUp} {
                      margin: 38px calc((100vw / 16) * 2);
                    }
                    @media ${bp.extraWideUp} {
                      margin: 38px calc((100vw / 16) * 3);
                    }

                    li.result {
                      display: inline;
                      padding: 0 20px 0 0;
                    }
                  }
                }
              `}</style>
            </div>
          </>);
        })}
      </Query>
    </MainLayout>
  </>);
};

export default ProblemsDashboardPage;
