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

import AddTask from 'components/AddTask';
const Tasks = React.lazy(() => import('components/Tasks'));

import { bp } from 'lib/variables';
import { Grid, Message } from 'semantic-ui-react';

import EnvironmentWithTasksQuery from 'lib/query/EnvironmentWithTasks';
import TasksSubscription from 'lib/subscription/Tasks';
import { LoadingRowsContent, LazyLoadingContent } from 'components/Loading';


/**
 * Displays the tasks page, given the openshift project name.
 */
export const PageTasks = ({ router }) => {
  const { loading, error, data: { environment } = {}, subscribeToMore, fetchMore } = useQuery(EnvironmentWithTasksQuery, {
    variables: { openshiftProjectName: router.query.environmentSlug },
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    const unsubscribe = environment && subscribeToMore({
      document: TasksSubscription,
      variables: { environment: environment && environment.id },
      updateQuery: (prevStore, { subscriptionData }) => {
        if (!subscriptionData.data) return prevStore;

        const prevTasks = prevStore.environment.tasks;
        const incomingTask = subscriptionData.data.taskChanged;
        const existingIndex = prevTasks.findIndex(
          prevTask => prevTask.id === incomingTask.id
        );
        let newTasks;

        // New task.
        if (existingIndex === -1) {
          newTasks = [incomingTask, ...prevTasks];
        }
        // Updated task
        else {
          newTasks = Object.assign([...prevTasks], {
            [existingIndex]: incomingTask
          });
        }

        const newStore = {
          ...prevStore,
          environment: {
            ...prevStore.environment,
            tasks: newTasks
          }
        };

        return newStore;
      }
    });

    return () => environment && unsubscribe();
  }, [environment, subscribeToMore]);


  return (
  <>
    <Head>
      <title>{`${router.query.environmentSlug} | Tasks`}</title>
    </Head>
    <MainLayout>
      <Grid centered padded>
        <Grid.Row>
          <Grid.Column width={2}>
            <MainNavigation>
              <Navigation />
            </MainNavigation>
          </Grid.Column>
          <Grid.Column width={14}>
            {error &&
              <Message negative>
                <Message.Header>Error: Unable to load tasks</Message.Header>
                <p>{`${error}`}</p>
              </Message>
            }
            {!loading && !environment && !error &&
              <Message>
                <Message.Header>No tasks found</Message.Header>
                <p>{`No tasks found for '${router.query.environmentSlug}'`}</p>
              </Message>
            }
            {loading && <LoadingRowsContent delay={250} rows="15"/>}
            {!loading && environment &&
            <>
              <EnvironmentHeader environment={environment}/>
              <NavTabs activeTab="tasks" environment={environment} />
                <div className="content">
                  <AddTask pageEnvironment={environment} fetchMore={() => fetchMore({
                    variables: {
                      environment,
                      after: environment,
                    }
                  })} />
                  <Suspense fallback={<LazyLoadingContent delay={250} rows="15"/>}>
                    <Tasks tasks={environment.tasks} />
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

export default withRouter(PageTasks);
