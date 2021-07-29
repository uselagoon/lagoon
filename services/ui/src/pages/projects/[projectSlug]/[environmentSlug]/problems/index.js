import React, { useState, Suspense } from "react";
import * as R from 'ramda';
import { withRouter } from 'next/router';
import { useQuery } from "@apollo/client";
import Head from 'next/head';

import MainNavigation from 'layouts/MainNavigation';
import MainLayout from 'layouts/MainLayout';
import Navigation from 'components/Navigation';
import NavTabs from 'components/NavTabs';
import EnvironmentHeader from 'components/EnvironmentHeader';

const Problems = React.lazy(() => import('components/Problems'));

import { bp, color } from 'lib/variables';
import { Grid, Message } from 'semantic-ui-react';

import EnvironmentWithProblemsQuery from 'lib/query/EnvironmentWithProblems';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';


/**
 * Displays the problems page, given the name of an openshift project.
 */
export const PageProblems = ({ router }) => {
  const { loading, error, data: { environment } = {}, subscribeToMore, fetchMore } = useQuery(EnvironmentWithProblemsQuery, {
    variables: { openshiftProjectName: router.query.environmentSlug },
    fetchPolicy: 'network-only'
  });

  return (
  <>
    <Head>
      <title>{`${router.query.environmentSlug} | Problems`}</title>
    </Head>
    <MainLayout>
      <Grid centered padded>
        <Grid.Row>
          <Grid.Column width={2}>
            <MainNavigation>
              <Navigation />
            </MainNavigation>
          </Grid.Column>
          <Grid.Column width={14} style={{ padding: "1em 4em" }}>
            {loading && <LoadingRowsContent delay={250} rows="15"/>}
            {!loading && environment &&
            <>
              <EnvironmentHeader environment={environment}/>
              <NavTabs activeTab="problems" environment={environment} />
              <div className="content">
                <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                  <Problems problems={environment.problems} />
                </Suspense>
              </div>
            </>
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <style jsx>{`
        .content {}
      `}</style>
    </MainLayout>
  </>);
};

export default withRouter(PageProblems);
