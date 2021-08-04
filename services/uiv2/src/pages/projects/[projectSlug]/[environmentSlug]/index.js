import React, { useState, useEffect, Suspense } from "react";
import * as R from 'ramda';
import { withRouter } from 'next/router';
import { useQuery } from "@apollo/client";
import Head from 'next/head';

import MainLayout from 'layouts/MainLayout';
import MainNavigation from 'layouts/MainNavigation';
import Navigation from 'components/Navigation';
import { Grid, Label, Menu, Icon, Message } from 'semantic-ui-react';
import Link from 'next/link';

import EnvironmentByOpenshiftProjectNameQuery from 'lib/query/EnvironmentByOpenshiftProjectName';
import EnvironmentHeader from 'components/EnvironmentHeader';
import NavTabs from 'components/NavTabs';

const Environment = React.lazy(() => import('components/Environment'));
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

import { bp } from 'lib/variables';
import MainSidebar from 'layouts/MainSidebar';

/**
 * Displays an environment page, given the openshift project name.
 */
export const PageEnvironment = ({ router }) => {
  const { loading, error, data: { environment } = {} } = useQuery(EnvironmentByOpenshiftProjectNameQuery, {
    variables: { openshiftProjectName: router.query.environmentSlug }
  });

  return (
  <>
    <Head>
      <title>{`${router.query.environmentSlug} | Environment`}</title>
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
            {error &&
              <Message negative>
                <Message.Header>Error: Unable to load environment</Message.Header>
                <p>{`${error}`}</p>
              </Message>
            }
            {!loading && !environment && !error &&
              <Message>
                <Message.Header>No environment found</Message.Header>
                <p>{`No environment found for '${router.query.environmentSlug}'`}</p>
              </Message>
            }
            {loading && <LoadingRowsContent delay={250} rows="15"/>}
            {!loading && environment &&
            <>
              <EnvironmentHeader environment={environment} />
              <NavTabs activeTab="overview" environment={environment} />
              <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                <div className="content">
                  <Environment environment={environment} />
                </div>
              </Suspense>
            </>
            }
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <style jsx>{`
      `}</style>
    </MainLayout>
  </>
)};

export default withRouter(PageEnvironment);
