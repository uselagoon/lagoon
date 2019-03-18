import React from 'react';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/main';
import EnvironmentWithTaskQuery from 'lib/query/EnvironmentWithTask';
import LoadingPage from 'pages/_loading';
import ErrorPage from 'pages/_error';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Task from 'components/Task';
import { bp } from 'lib/variables';

const PageTask = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.taskId} | Task`}</title>
    </Head>
    <Query
      query={EnvironmentWithTaskQuery}
      variables={{
        openshiftProjectName: router.query.openshiftProjectName
      }}
    >
      {({
        loading,
        error,
        data: { environmentByOpenshiftProjectName: environment }
      }) => {
        if (loading) {
          return <LoadingPage />;
        }

        if (error) {
          return <ErrorPage statusCode={500} errorMessage={error.toString()} />;
        }

        if (!environment) {
          return (
            <ErrorPage
              statusCode={404}
              errorMessage={`Environment "${
                router.query.openshiftProjectName
              }" not found`}
            />
          );
        }

        const task = environment.tasks.find(
          task => task.id === parseInt(router.query.taskId)
        );

        if (!task) {
          return (
            <ErrorPage
              statusCode={404}
              errorMessage={`Task "${router.query.taskId}" not found`}
            />
          );
        }

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
                <Task task={task} />
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
        );
      }}
    </Query>
  </>
);

export default withRouter(PageTask);
