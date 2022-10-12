import React from 'react';
import * as R from 'ramda';
import { withRouter } from 'next/router';
import Head from 'next/head';
import getConfig from 'next/config';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import OrganizationByIDQuery from 'lib/query/OrganizationByID';
import Breadcrumbs from 'components/Breadcrumbs';
import OrganizationBreadcrumb from 'components/Breadcrumbs/Organization';
import OrgNavTabs from 'components/OrgNavTabs';
import Groups from 'components/OrgGroups';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';
import { withOrganizationRequired } from 'lib/withDataRequired';
import { bp } from 'lib/variables';

/**
 * Displays the groups page, given the openshift project name.
 */
export const PageGroups = ({ router }) => (
  <>
    <Query
      query={OrganizationByIDQuery}
      variables={{ id: parseInt(router.query.organizationSlug, 10) }}
    >
      {R.compose(
        withQueryLoading,
        withQueryError,
        withOrganizationRequired
      )(({ data: { organization } }) => {
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
                <OrgNavTabs activeTab="groups" organization={organization} />
                <div className="groups-wrapper">
                  <Groups groups={organization.groups} organizationId={router.query.organizationSlug} organizationName={organization.name} />
                </div>
              </div>
              <style jsx>{`
                .content-wrapper {
                  @media ${bp.tabletUp} {
                    display: flex;
                    justify-content: space-between;
                  }
                }
                .groups-wrapper {
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

export default withRouter(PageGroups);
