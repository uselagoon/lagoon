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
import Deployment from 'components/Deployment';

import { Grid, Message } from 'semantic-ui-react';
import { bp } from 'lib/variables';

import EnvironmentWithDeploymentQuery from 'lib/query/EnvironmentWithDeployment';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {
  withEnvironmentRequired,
  withDeploymentRequired
} from 'lib/withDataRequired';

/**
 * Displays a deployment page, given the openshift project and deployment name.
 */
export const PageDeployment = ({ router }) => {
  const { loading, error, data: { environment } = {}, subscribeToMore, fetchMore } = useQuery(EnvironmentWithDeploymentQuery, {
    variables: {
      openshiftProjectName: router.query.environmentSlug,
      deploymentName: router.query.deploymentName
    }
  });

  return (
    <>
      <Head>
        <title>{`${router.query.deploymentName} | Deployment`}</title>
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
                  <Message.Header>Error: Unable to load deployment</Message.Header>
                  <p>{`${error}`}</p>
                </Message>
              }
              {!loading && environment && !environment.deployments.length && !error &&
                <Message>
                  <Message.Header>No deployment found</Message.Header>
                  <p>{`No deployment found for '${router.query.deploymentName}'`}</p>
                </Message>
              }
              {!loading && environment && environment.deployments.length > 0 &&
                <div className="content-wrapper">
                  <EnvironmentHeader environment={environment}/>
                  <NavTabs activeTab="deployments" environment={environment} />
                  <div className="content">
                    <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                      <Deployment deployment={environment.deployments[0]} />
                    </Suspense>
                  </div>
                </div>
              }
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </MainLayout>
    </>
  );
};

export default withRouter(PageDeployment);
