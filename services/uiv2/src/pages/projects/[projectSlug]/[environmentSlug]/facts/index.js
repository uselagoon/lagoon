import React, { useState, useEffect, Suspense } from "react";
import * as R from 'ramda';
import { withRouter } from 'next/router';
import { useQuery } from "@apollo/client";
import Head from 'next/head';

import MainLayout from 'layouts/MainLayout';
import MainNavigation from 'layouts/MainNavigation';
import Navigation from 'components/Navigation';
import NavTabs from 'components/NavTabs';
import EnvironmentHeader from 'components/EnvironmentHeader';

import Facts from 'components/Facts';
import { bp } from 'lib/variables';
import { Grid, Message } from 'semantic-ui-react';

import EnvironmentWithFactsQuery from 'lib/query/EnvironmentWithFacts';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

/**
 * Displays the facts page, given the name of an openshift project.
 */
export const PageFacts = ({ router }) => {
  const { loading, error, data: { environment } = {} } = useQuery(EnvironmentWithFactsQuery, {
    variables: { openshiftProjectName: router.query.environmentSlug }
  });

  return (
  <>
    <Head>
      <title>{`${router.query.environmentSlug} | Facts`}</title>
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
                  <Message.Header>Error: Unable to load facts</Message.Header>
                  <p>{`${error}`}</p>
                </Message>
              }
              {!loading && !environment && !error &&
                <Message>
                  <Message.Header>No facts found</Message.Header>
                  <p>{`No facts found for '${router.query.environmentSlug}'`}</p>
                </Message>
              }
              {loading && <LoadingRowsContent delay={250} rows="15"/>}
              {!loading && environment &&
              <>
                <EnvironmentHeader environment={environment}/>
                <NavTabs activeTab="facts" environment={environment} />
                <div className="content">
                  <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                    <Facts facts={environment.facts} />
                  </Suspense>
                </div>
              </>
              }
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </MainLayout>
    </>
  );
};

export default withRouter(PageFacts);
