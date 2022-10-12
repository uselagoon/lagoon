import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import getConfig from 'next/config';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import OrganizationNotificationsByIDQuery from 'lib/query/OrganizationNotificationsByID';
import Breadcrumbs from 'components/Breadcrumbs';
import OrganizationBreadcrumb from 'components/Breadcrumbs/Organization';
import OrgNavTabs from 'components/OrgNavTabs';
import DeployLatest from 'components/DeployLatest';
import Projects from 'components/Projects';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import {  withOrganizationRequired } from 'lib/withDataRequired';
import { bp } from 'lib/variables';
import OrgNotifications from '../components/OrgNotifications';

/**
 * Displays the projects page, given the organization id
 */
export const PageOrgNotifications = ({ router }) => (
  <>
  <Query
    query={OrganizationNotificationsByIDQuery}
    variables={{ id: parseInt(router.query.organizationSlug, 10) }}
  >
    {R.compose(
      withQueryLoading,
      withQueryError,
      withOrganizationRequired
    )(({ data: { organization, slacks, emails, rocketchats } }) => {
      return (
        <>
          <Head>
            <title>{`${organization.name} | Organization`}</title>
          </Head>
          <MainLayout>
            <Breadcrumbs>
              <OrganizationBreadcrumb organizationSlug={organization.id} organizationName={organization.name} />
            </Breadcrumbs>
            <div className="content-wrapper">
              <OrgNavTabs activeTab="notifications" organization={organization} />
              <div className="notifications-wrapper">
                <OrgNotifications
                slacks={organization.slacks}
                emails={organization.emails}
                rocketchats={organization.rocketchats}
                teams={organization.teams}
                webhooks={organization.webhook}
                organizationId={organization.id}
                organizationName={organization.name} />
              </div>
            </div>
            <style jsx>{`
              .content-wrapper {
                @media ${bp.tabletUp} {
                  display: flex;
                  justify-content: space-between;
                }
              }
              .notifications-wrapper {
                flex-grow: 1;
                padding: 40px calc((100vw / 16) * 1);
              }
              .content {
                padding: 32px calc((100vw / 16) * 1);
                width: 100%;
              }
            `}</style>
          </MainLayout>
        </>
      );
      })}
    </Query>
  </>
);

export default withRouter(PageOrgNotifications);
