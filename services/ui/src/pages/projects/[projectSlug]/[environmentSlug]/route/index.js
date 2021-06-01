import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from '@apollo/client/react/components';
import MainLayout from 'layouts/MainLayout';
import EnvironmentByOpenshiftProjectNameQuery from 'lib/query/EnvironmentByOpenshiftProjectName';
import Breadcrumbs from 'components/Breadcrumbs';
import ProjectBreadcrumb from 'components/Breadcrumbs/Project';
import EnvironmentBreadcrumb from 'components/Breadcrumbs/Environment';
import NavTabs from 'components/NavTabs';
import Route from 'components/Route';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withEnvironmentRequired } from 'lib/withDataRequired';
import { bp, color } from 'lib/variables';

/**
 * Displays the route page, given the name of an openshift project.
 */
export const PageRoute = ({ router }) => (
  <>
    <Head>
      <title>{`${router.query.environmentSlug} | Route`}</title>
    </Head>
    <Query
      query={EnvironmentByOpenshiftProjectNameQuery}
      variables={{
        openshiftProjectName: router.query.environmentSlug
      }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withEnvironmentRequired
      )(({ data: { environment } }) => {

        return (
          <MainLayout>
            <div className="content-wrapper">
            <Breadcrumbs>
              <ProjectBreadcrumb projectSlug={environment.project.name} />
              <EnvironmentBreadcrumb
                environmentSlug={environment.environmentSlug}
                projectSlug={environment.project.name}
              />
            </Breadcrumbs>
              <NavTabs activeTab="route" environment={environment} />
              <div className="content">
                <Route environment={environment} />
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

              .notification {
                background-color: ${color.lightBlue};
                color: ${color.white};
                padding: 10px 20px;
              }
            `}</style>
          </MainLayout>
        );
      })}
    </Query>
  </>
);

export default withRouter(PageRoute);
