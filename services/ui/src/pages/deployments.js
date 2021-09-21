import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import getConfig from 'next/config';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithDeploymentsQuery from 'lib/query/EnvironmentWithDeployments';
import DeploymentsSubscription from 'lib/subscription/Deployments';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import DeployLatest from 'components/DeployLatest';
import Deployments from 'components/Deployments';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withEnvironmentRequired } from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';

const { publicRuntimeConfig } = getConfig();
const envLimit = parseInt(publicRuntimeConfig.LAGOON_UI_DEPLOYMENTS_LIMIT, 10);
const deploymentsLimit = envLimit === -1 ? null : envLimit;

/**
 * Displays the deployments page, given the openshift project name.
 */
export const PageDeployments = ({ router }) => {
  return (
    <>
      <Head>
        <title>{`${router.query.openshiftProjectName} | Deployments`}</title>
      </Head>
      <Query
        query={EnvironmentWithDeploymentsQuery}
        variables={{
          openshiftProjectName: router.query.openshiftProjectName,
          limit: deploymentsLimit
        }}
      >
        {R.compose(
          withQueryLoading,
          withQueryError,
          withEnvironmentRequired
        )(({ data: { environment }, subscribeToMore }) => {
          subscribeToMore({
            document: DeploymentsSubscription,
            variables: { environment: environment.id },
            updateQuery: (prevStore, { subscriptionData }) => {
              if (!subscriptionData.data) return prevStore;
              const prevDeployments = prevStore.environment.deployments;
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
                environment: {
                  ...prevStore.environment,
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
                  <DeployLatest pageEnvironment={environment} />
                  <Deployments
                    deployments={environment.deployments}
                    environmentSlug={environment.openshiftProjectName}
                    projectSlug={environment.project.name}
                  />
                </div>
              </div>
              <div className="message-wrapper">
                <div className="content">Number of results displayed is limited to {deploymentsLimit}</div>
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

                .message-wrapper {
                  border-top: 1px solid #f5f6fa;
                  border-radius: 3px;
                  box-shadow: 0px 4px 8px 0px rgb(0 0 0 / 3%);

                  .content {
                    padding: 9px calc((100vw / 16) * 1);
                    text-align: center;
                    color: ${color.darkGrey};
                  }
                }
              `}</style>
            </MainLayout>
          );
        })}
      </Query>
    </>
  );
};

export default withRouter(PageDeployments);
