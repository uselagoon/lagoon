import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from '@apollo/client';
import MainLayout from 'layouts/MainLayout';
import EnvironmentWithDeploymentQuery from 'lib/query/EnvironmentWithDeployment';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Deployment from 'components/Deployment';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {
  withEnvironmentRequired,
  withDeploymentRequired
} from 'lib/withDataRequired';
import { bp } from 'lib/variables';

/**
 * Displays a deployment page, given the openshift project and deployment name.
 */
export const PageDeployment = ({ router }) => {
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
        {R.compose(
          withQueryLoading,
          withQueryError,
          withEnvironmentRequired,
          withDeploymentRequired
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
        ))}
      </Query>
    </>
  );
};

export default withRouter(PageDeployment);
