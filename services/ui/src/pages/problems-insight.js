import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import AllProblemsQuery from 'lib/query/AllProblems';
import AllProjectsAndEnvironmentsQuery from 'lib/query/AllProjectsAndEnvironments';
import Problems from 'components/Problems';
import ProjectFilter from 'components/Filters';
import withQueryLoadingNoHeader from 'lib/withQueryLoadingNoHeader';
import withQueryNoHeaderError from 'lib/withQueryNoHeaderError';
import { bp } from 'lib/variables';
import Select from 'react-select';

const severityOptions = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low'},
    { value: 'NEGLIGIBLE', label: 'Negligible'},
    { value: 'UNKNOWN', label: 'Unknown'},
    { value: 'NONE', label: 'None'},
];

/**
 * Displays the problems overview page.
 */
const ProblemsInsightPage = () => {
  const [environmentID, setEnvironmentID] = React.useState(0);
  const [environmentLabel, setEnvironmentLabel] = React.useState('All');
  const [severityOption, setSeverityOption] = React.useState([]);
  const [severityLabel, setSeverityLabel] = React.useState([]);

  const handleProjectChange = (environment) => {
    setEnvironmentID(environment.value);
    setEnvironmentLabel(environment.label);
  };

  const handleSeverityChange = (option) => {
    setSeverityOption(severityOption => [...severityOption, option.value]);
    setSeverityLabel(severityLabel => [...severityLabel, option.label]);
  };

  const handleReset = () => {
    setEnvironmentID(0);
    setEnvironmentLabel('All');
    setSeverityOption([]);
    setSeverityLabel([]);
  };

  const { data, loading, error } = useQuery(AllProjectsAndEnvironmentsQuery);

console.log(environmentID);

  return (
  <>
    <Head>
      <title>Problems Insight</title>
    </Head>
    <MainLayout>
        <div className="filters">
            <h2>Problems Dashboard</h2>
            {loading && "Loading..."}
            {data && (
              <ProjectFilter
                  title="Projects"
                  options={data.projects}
                  onFilterChange={handleProjectChange}
                  currentValues={{value: environmentID, label: environmentLabel}}
                  multi
              />
            )}
          <h4>Severity</h4>
          <Select
              name="severity-filter"
              placeholder="e.g Critical, High, Medium, Low"
              options={severityOptions}
              onChange={handleSeverityChange}
              value={{label: severityLabel, value: severityOption}}
              multi
          />
          <button type="button" onClick={handleReset}>Reset</button>
            <style jsx>{`
                .filters {
                  margin: 38px calc((100vw / 16) * 1);
                  @media ${bp.wideUp} {
                    margin: 38px calc((100vw / 16) * 2);
                  }
                  @media ${bp.extraWideUp} {
                    margin: 38px calc((100vw / 16) * 3);
                  }
                }
            `}</style>
        </div>
            <Query
                query={AllProblemsQuery}
                variables={{
                    environment: environmentID,
                    severity: severityOption
                }}
                displayName="AllProblemsQuery"
            >
                {R.compose(
                    withQueryLoadingNoHeader,
                    withQueryNoHeaderError
                )(({data: {problems, environment}}) => {
console.log(environment);
                  return (
                    <div className="content-wrapper">
                        <div className="content">
                            <Problems problems={problems || []} meta={environment && environment}/>
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
                              }
                            }
                        `}</style>
                    </div>
                  );
                })}
            </Query>
      </MainLayout>
  </>
  );
};

export default ProblemsInsightPage;
