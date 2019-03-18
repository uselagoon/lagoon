import React from 'react';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/main';
import EnvironmentWithDeploymentQuery from 'lib/query/EnvironmentWithDeployment';
import LoadingPage from 'pages/_loading';
import ErrorPage from 'pages/_error';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Deployment from 'components/Deployment';
import { bp } from 'lib/variables';

const PageDeployment = ({ router }) => {
  return (
    <>
      <Head>
        <title>{`${router.query.deploymentName} | Deployment`}</title>
      </Head>
      <Query
        query={EnvironmentWithDeploymentQuery}
        variables={{
          openshiftProjectName: router.query.openshiftProjectName,
          deploymentName: router.query.deploymentName
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
            return (
              <ErrorPage statusCode={500} errorMessage={error.toString()} />
            );
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

          if (!environment.deployments.length) {
            return (
              <ErrorPage
                statusCode={404}
                errorMessage={`Deployment "${
                  router.query.deploymentName
                }" not found`}
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
                <NavTabs activeTab="deployments" environment={environment} />
                <div className="content">
                  <Deployment deployment={environment.deployments[0]} />
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
};

export default withRouter(PageDeployment);
