import React from 'react';
import * as R from 'ramda';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import AllProblemsQuery from 'lib/query/AllProblems';
import Problems from 'components/Problems';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { bp } from 'lib/variables';

/**
 * Displays the problems overview page.
 */
const ProblemsInsightsPage = () => (
  <>
    <Head>
      <title>Problems Insights</title>
    </Head>
    <Query query={AllProblemsQuery} displayName="AllProblemsQuery">
      {R.compose(
        withQueryLoading,
        withQueryError
      )(({ data }) => {
          console.log(data.allGroups);

          return(
              <MainLayout>
                  <div className="content-wrapper">
                      <h2>Problems</h2>
                      <div className="content">
                          <Problems projects={data.allGroups || []}/>
                      </div>
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
              </MainLayout>
          );
      }
    )}
    </Query>
  </>
);

export default ProblemsInsightsPage;
