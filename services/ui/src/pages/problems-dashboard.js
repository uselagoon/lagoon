import React, { useState, useEffect } from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import AllProblemsQuery from 'lib/query/AllProblems';
import ProblemsByIdentifier from "components/ProblemsByIdentifier";
import SelectFilter from 'components/Filters';
import withQueryLoadingNoHeader from 'lib/withQueryLoadingNoHeader';
import withQueryNoHeaderError from 'lib/withQueryNoHeaderError';
import { bp } from 'lib/variables';

const severityOptions = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low'},
    { value: 'NEGLIGIBLE', label: 'Negligible'},
    { value: 'UNKNOWN', label: 'Unknown'},
    { value: 'NONE', label: 'None'},
];

const sourceOptions = [
    { value: 'drutiny', label: 'Drutiny' },
    { value: 'harbor', label: 'Harbor' },
];

/**
 * Displays the problems overview page.
 */
const ProblemsDashboardPage = () => {
  const [source, setSource] = React.useState([]);
  const [severityOption, setSeverityOption] = React.useState([]);

  const handleSourceChange = (source) => {
    if (source) {
      let values = source.map(s => s.value);
      setSource(values);
    }
  };

  const handleSeverityChange = (severity) => {
      if (severity) {
        let values = severity.map(s => s.value);
        setSeverityOption(values);
      }
  };

  return (
  <>
    <Head>
      <title>Problems Dashboard</title>
    </Head>
    <MainLayout>
        <div className="filters-wrapper">
            <h2>Problems Dashboard</h2>
            <div className="filters">
                <SelectFilter
                    title="Source"
                    options={sourceOptions}
                    onFilterChange={handleSourceChange}
                    // currentValues={{label: sourceLabel, value: sourceID}}
                    placeholder="e.g. Drutiny, Harbor"
                    isMulti
                />
                <SelectFilter
                    title="Severity"
                    options={severityOptions}
                    onFilterChange={handleSeverityChange}
                    // currentValues={{label: severityLabel, value: severityOption}}
                    placeholder="e.g Critical, High, Medium, Low"
                    isMulti
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
                  }
                }
            `}</style>
        </div>
            <Query
                query={AllProblemsQuery}
                variables={{
                    source: source && source,
                    severity: severityOption
                }}
                displayName="AllProblemsQuery"
            >
                {R.compose(
                    withQueryLoadingNoHeader,
                    withQueryNoHeaderError
                )(({data: { problems }}) => {
                  return (
                    <div className="content-wrapper">
                        <div className="content">
                            <ProblemsByIdentifier problems={problems || []}/>
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

export default ProblemsDashboardPage;
