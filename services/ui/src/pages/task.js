import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from '@apollo/client';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithTaskQuery from 'lib/query/EnvironmentWithTask';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Task from 'components/Task';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {
  withEnvironmentRequired,
  withTaskRequired
} from 'lib/withDataRequired';
import { bp } from 'lib/variables';

/**
 * Displays a task page, given the openshift project and task ID.
 */
export const PageTask = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.taskId} | Task`}</title>
    </Head>
    <Query
      query={EnvironmentWithTaskQuery}
      variables={{
        openshiftProjectName: router.query.openshiftProjectName,
        taskId: parseInt(router.query.taskId, 10)
      }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withEnvironmentRequired,
        withTaskRequired
      )(({ data: { environment } }) => (
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
              <Task task={environment.tasks[0]} />
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
              width: 100%;
            }
          `}</style>
        </MainLayout>
      ))}
    </Query>
  </>
);

export default withRouter(PageTask);
