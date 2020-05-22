import React, { useState, useEffect } from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import AllProblemsQuery from 'lib/query/AllProblems';
import Problems from 'components/Problems';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { bp } from 'lib/variables';
import Breadcrumbs from 'components/Breadcrumbs';
import Select from 'react-select';

const severityOptions = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low'}
];

const environmentOptions = [
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4'}
];

/**
 * Displays the problems overview page.
 */
const ProblemsInsightPage = () => {

  const [isLoading, setIsLoading] = React.useState(false);
  const [environmentID, setEnvironmentID] = React.useState(null);

  const handleEnvironmentChange = (environmentID) => {
    setEnvironmentID(environmentID.value);
    console.log(`Option selected:`, environmentID.value);
  };

  return (
  <>
    <Head>
      <title>Problems Insight</title>
    </Head>
    <Query
      query={AllProblemsQuery}
      variables={
        { environment: environmentID }
      }
      displayName="AllProblemsQuery"
    >
      {R.compose(
        withQueryLoading,
        withQueryError
      )(({data}) => {

        // const severity = data.allProblems.map(problem => problem.severity);

        return (
          <MainLayout>
            <Breadcrumbs>
              <h2>Problems Dashboard</h2>
            </Breadcrumbs>
            <div className="content-wrapper">
              <div className="content">
                <div className="filters">
                  <h3>Project</h3>
                  <Select
                    options={environmentOptions}
                    onChange={handleEnvironmentChange}
                    value={environmentID}
                  />
                  <h3>Severity</h3>
                  <Select options={severityOptions}/>
                </div>
                <Problems problems={data.allProblems || []}/>
              </div>
            </div>
            <style jsx>{`
                .content-wrapper {
                  .filters {
                    margin: auto;
                  }
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
          </MainLayout>
        );
      })}
    </Query>
  </>
  );
};

export default ProblemsInsightPage;
