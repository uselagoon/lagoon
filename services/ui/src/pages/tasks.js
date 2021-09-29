import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import getConfig from 'next/config';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithTasksQuery from 'lib/query/EnvironmentWithTasks';
import TasksSubscription from 'lib/subscription/Tasks';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import AddTask from 'components/AddTask';
import Tasks from 'components/Tasks';
import ResultsLimited from 'components/ResultsLimited';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withEnvironmentRequired } from 'lib/withDataRequired';
import { bp } from 'lib/variables';

const { publicRuntimeConfig } = getConfig();
const envLimit = parseInt(publicRuntimeConfig.LAGOON_UI_TASKS_LIMIT, 10);
const customMessage = publicRuntimeConfig.AGOON_UI_TASKS_LIMIT_MESSAGE;

let urlResultLimit = envLimit;
if (typeof window !== "undefined") {
  let search = window.location.search;
  let params = new URLSearchParams(search);
  let limit = params.get('limit');
  if (limit) {
    urlResultLimit = parseInt(limit.trim(), 10);
  }
}
const resultLimit = urlResultLimit === -1 ? null : urlResultLimit;
/**
 * Displays the tasks page, given the openshift project name.
 */
export const PageTasks = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.openshiftProjectName} | Tasks`}</title>
    </Head>
    <Query
      query={EnvironmentWithTasksQuery}
      variables={{
        openshiftProjectName: router.query.openshiftProjectName,
        limit: resultLimit
      }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withEnvironmentRequired
      )(({ data: { environment }, subscribeToMore }) => {
        subscribeToMore({
          document: TasksSubscription,
          variables: { environment: environment.id },
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

        return (
          <MainLayout>
            <Breadcrumbs>
              <ProjectBreadcrumb projectSlug={environment.project.name} />
              <EnvironmentBreadcrumb
                environmentSlug={environment.openshiftProjectName}
                projectSlug={environment.project.name}
              />
            </Breadcrumbs>
            <div className="content-wrapper">
              <NavTabs activeTab="tasks" environment={environment} />
              <div className="content">
                <AddTask pageEnvironment={environment} />
                <Tasks
                  tasks={environment.tasks}
                  environmentSlug={environment.openshiftProjectName}
                  projectSlug={environment.project.name}
                />
                <ResultsLimited
                  limit={resultLimit}
                  results={environment.tasks.length}
                  message={(!customMessage && "") || (customMessage && customMessage.replace(/['"]+/g, ''))}
                />
              </div>
            </div>
            <style jsx>{`
              .content-wrapper {
                @media ${bp.tabletUp} {
                  display: flex;
                  padding: 0;
                }
              }

              .content {
                padding: 32px calc((100vw / 16) * 1);
                width: 100%;
              }
            `}</style>
          </MainLayout>
        );
      })}
    </Query>
  </>
);

export default withRouter(PageTasks);
