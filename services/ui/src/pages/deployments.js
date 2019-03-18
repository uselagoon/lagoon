import React from 'react';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/main';
import EnvironmentWithDeploymentsQuery from 'lib/query/EnvironmentWithDeployments';
import DeploymentsSubscription from 'lib/subscription/Deployments';
import LoadingPage from 'pages/_loading';
import ErrorPage from 'pages/_error';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Deployments from 'components/Deployments';
import { bp } from 'lib/variables';

const PageDeployments = ({ router }) => {
  return (
    <>
      <Head>
        <title>{`${router.query.openshiftProjectName} | Deployments`}</title>
      </Head>
      <Query
        query={EnvironmentWithDeploymentsQuery}
        variables={{ openshiftProjectName: router.query.openshiftProjectName }}
      >
        {({
          loading,
          error,
          data: { environmentByOpenshiftProjectName: environment },
          subscribeToMore
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

          subscribeToMore({
            document: DeploymentsSubscription,
            variables: { environment: environment.id },
            updateQuery: (prevStore, { subscriptionData }) => {
              if (!subscriptionData.data) return prevStore;
              const prevDeployments =
                prevStore.environmentByOpenshiftProjectName.deployments;
              const incomingDeployment =
                subscriptionData.data.deploymentChanged;
              const existingIndex = prevDeployments.findIndex(
                prevDeployment => prevDeployment.id === incomingDeployment.id
              );
              let newDeployments;

              // New deployment.
              if (existingIndex === -1) {
                newDeployments = [incomingDeployment, ...prevDeployments];
              }
              // Updated deployment
              else {
                newDeployments = Object.assign([...prevDeployments], {
                  [existingIndex]: incomingDeployment
                });
              }

              const newStore = {
                ...prevStore,
                environmentByOpenshiftProjectName: {
                  ...prevStore.environmentByOpenshiftProjectName,
                  deployments: newDeployments
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
                <NavTabs activeTab="deployments" environment={environment} />
                <div className="content">
                  <Deployments
                    deployments={environment.deployments}
                    projectName={environment.openshiftProjectName}
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
        }}
      </Query>
    </>
  );
};

export default withRouter(PageDeployments);
