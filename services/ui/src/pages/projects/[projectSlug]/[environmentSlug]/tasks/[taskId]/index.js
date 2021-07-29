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
import Task from 'components/Task';

import { bp } from 'lib/variables';
import { Grid, Message } from 'semantic-ui-react';

import EnvironmentWithTaskQuery from 'lib/query/EnvironmentWithTask';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

/**
 * Displays a task page, given the openshift project and task ID.
 */
export const PageTask = ({ router }) => {
  const { loading, error, data: { environment } = {} } = useQuery(EnvironmentWithTaskQuery, {
    variables: {
      openshiftProjectName: router.query.environmentSlug,
      taskId: parseInt(router.query.taskId)
    }
  });

  return (
  <>
    <Head>
      <title>{`${router.query.taskId} | Task`}</title>
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
                  <Message.Header>Error: Unable to load task</Message.Header>
                  <p>{`${error}`}</p>
                </Message>
              }
              {!loading && environment && !environment.tasks.length && !error &&
                <Message>
                  <Message.Header>No task found</Message.Header>
                  <p>{`No task found for '${router.query.taskId}'`}</p>
                </Message>
              }
              {loading && <LoadingRowsContent delay={250} rows="15"/>}
              {!loading && environment && environment.tasks.length > 0 &&
              <>
                <EnvironmentHeader environment={environment}/>
                <NavTabs activeTab="tasks" environment={environment} />
                <div className="content">
                  <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                    <Task task={environment.tasks[0]} />
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

export default withRouter(PageTask);
