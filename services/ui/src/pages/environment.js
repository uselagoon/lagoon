import React from 'react';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/main';
import EnvironmentByOpenshiftProjectNameQuery from 'lib/query/EnvironmentByOpenshiftProjectName';
import LoadingPage from 'pages/_loading';
import ErrorPage from 'pages/_error';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Environment from 'components/Environment';
import { bp } from 'lib/variables';

const PageEnvironment = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.openshiftProjectName} | Environment`}</title>
    </Head>
    <Query
      query={EnvironmentByOpenshiftProjectNameQuery}
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
              <NavTabs activeTab="overview" environment={environment} />
              <div className="content">
                <Environment environment={environment} />
              </div>
            </div>
            <style jsx>{`
              .content-wrapper {
                @media ${bp.tabletUp} {
                  display: flex;
                  padding: 0;
                }
              }
            `}</style>
          </MainLayout>
        );
      }}
    </Query>
  </>
);

export default withRouter(PageEnvironment);
